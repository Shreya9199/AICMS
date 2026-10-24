import re
import string
import logging
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta

logger = logging.getLogger("nivaran.nlp")

# Global flags for loaded models
_spacy_nlp = None
_sentence_model = None
_models_checked = False

def get_spacy_model():
    global _spacy_nlp, _models_checked
    if _spacy_nlp is not None:
        return _spacy_nlp
    try:
        import spacy
        # Try loading lightweight English model or blank English tokenizer
        try:
            _spacy_nlp = spacy.load("en_core_web_sm")
            logger.info("Loaded spaCy en_core_web_sm model")
        except Exception:
            _spacy_nlp = spacy.blank("en")
            logger.info("Loaded spaCy blank 'en' tokenizer as fallback")
        return _spacy_nlp
    except Exception as e:
        logger.warning(f"spaCy is not installed or failed to load: {e}")
        return None

def get_sentence_transformer():
    global _sentence_model
    if _sentence_model is not None:
        return _sentence_model
    try:
        from sentence_transformers import SentenceTransformer
        _sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Loaded SentenceTransformer all-MiniLM-L6-v2")
        return _sentence_model
    except Exception as e:
        logger.warning(f"SentenceTransformer not available: {e}")
        return None

def normalize_text(text: str) -> str:
    """Normalize text: lowercase, remove punctuation, strip whitespace."""
    if not text:
        return ""
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\s+", " ", text).strip()
    return text

def tokenize_and_lemmatize(text: str) -> List[str]:
    """Tokenize and lemmatize using spaCy if available, else simple whitespace tokenizer."""
    nlp = get_spacy_model()
    if nlp is not None:
        doc = nlp(text.lower())
        tokens = [token.lemma_ for token in doc if not token.is_stop and not token.is_punct and token.text.strip()]
        if tokens:
            return tokens
    
    # Fallback rule-based tokenization
    clean = normalize_text(text)
    stop_words = {"the", "a", "an", "is", "in", "at", "of", "on", "and", "or", "to", "for", "with", "this", "that", "my", "was", "we", "be"}
    return [w for w in clean.split() if len(w) > 2 and w not in stop_words]

def compute_jaccard_similarity(tokens_a: List[str], tokens_b: List[str]) -> float:
    set_a = set(tokens_a)
    set_b = set(tokens_b)
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return float(intersection) / float(union) if union > 0 else 0.0

def compute_tfidf_similarity(text_a: str, text_b: str) -> float:
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        vec = TfidfVectorizer().fit_transform([text_a, text_b])
        sim = cosine_similarity(vec[0:1], vec[1:2])
        return float(sim[0][0])
    except Exception:
        # Simple fallback
        tokens_a = tokenize_and_lemmatize(text_a)
        tokens_b = tokenize_and_lemmatize(text_b)
        return compute_jaccard_similarity(tokens_a, tokens_b)

def compute_semantic_similarity(text_a: str, text_b: str) -> Tuple[float, str]:
    """
    Computes similarity using Sentence Transformers if available.
    Returns (score, method_used).
    """
    st_model = get_sentence_transformer()
    if st_model is not None:
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            embeddings = st_model.encode([text_a, text_b])
            score = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
            return max(0.0, min(1.0, score)), "SentenceTransformers(all-MiniLM-L6-v2) + Cosine"
        except Exception as e:
            logger.warning(f"Error during SentenceTransformer inference: {e}")

    # Fallback to TF-IDF / Lemmatized Jaccard
    score = compute_tfidf_similarity(text_a, text_b)
    return max(0.0, min(1.0, score)), "spaCy/TF-IDF Rule-Based Similarity (Graceful Fallback)"

def detect_duplicates(
    new_complaint: Dict[str, Any],
    existing_complaints: List[Dict[str, Any]],
    similarity_threshold: float = 0.55
) -> List[Dict[str, Any]]:
    """
    Compare new complaint against existing complaints.
    Returns ranked possible duplicates with explainable match reasons.
    Does NOT automatically reject or alter status; for official review only.
    """
    matches = []
    new_text = f"{new_complaint.get('subject', '')}. {new_complaint.get('description', '')}"
    new_cat = (new_complaint.get("category") or "").strip().lower()
    new_inst = (new_complaint.get("institution_name") or "").strip().lower()
    new_state = (new_complaint.get("institution_state") or "").strip().lower()
    new_date = new_complaint.get("submitted_at") or datetime.utcnow()

    for cand in existing_complaints:
        # Ignore self
        if cand.get("id") == new_complaint.get("id"):
            continue

        cand_text = f"{cand.get('subject', '')}. {cand.get('description', '')}"
        cand_cat = (cand.get("category") or "").strip().lower()
        cand_inst = (cand.get("institution_name") or "").strip().lower()
        cand_state = (cand.get("institution_state") or "").strip().lower()
        cand_date = cand.get("submitted_at") or datetime.utcnow()

        reasons = []
        score_multiplier = 0.0

        # Rule 1: Exact or substring Institution match
        if new_inst and cand_inst and (new_inst in cand_inst or cand_inst in new_inst):
            reasons.append(f"Same Institution: '{cand.get('institution_name')}'")
            score_multiplier += 0.20

        # Rule 2: Same Category match
        if new_cat and cand_cat and new_cat == cand_cat:
            reasons.append(f"Same Grievance Category: '{cand.get('category')}'")
            score_multiplier += 0.15

        # Rule 3: Same State match
        if new_state and cand_state and new_state == cand_state:
            reasons.append(f"Same State: '{cand.get('institution_state')}'")
            score_multiplier += 0.05

        # Rule 4: Submission window check (within 30 days)
        try:
            day_diff = abs((new_date - cand_date).days)
            if day_diff <= 30:
                reasons.append(f"Submitted recently ({day_diff} days apart)")
                score_multiplier += 0.10
        except Exception:
            pass

        # NLP Text Semantic Similarity
        text_score, method_name = compute_semantic_similarity(new_text, cand_text)
        
        # Combined explainable score (weighted semantic + metadata factors)
        # 60% text content + 40% metadata affinity
        final_score = round(min(1.0, (text_score * 0.65) + score_multiplier), 3)

        if final_score >= similarity_threshold or (text_score >= 0.70):
            reasons.append(f"Text similarity: {round(text_score * 100, 1)}% via {method_name}")
            match_reason = "; ".join(reasons)
            matches.append({
                "possible_duplicate_id": cand.get("id"),
                "possible_duplicate_number": cand.get("complaint_number"),
                "possible_duplicate_subject": cand.get("subject"),
                "similarity_score": final_score,
                "match_reason": match_reason,
                "method": method_name
            })

    # Sort descending by similarity score
    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches[:5]  # Top 5 suggestions
