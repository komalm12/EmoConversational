# ml-service/app.py - UPDATED WITH PERSONA SUPPORT

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import (
    BlenderbotForConditionalGeneration,
    BlenderbotTokenizer,
    pipeline as hf_pipeline
)
from groq import Groq
import torch
import os


print("INITIALIZING ML SERVICE")
print("-"*60)


MODEL_ID = "Vaibhavkumawatt/empathetic-blenderbot"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

print(f"\nLoading model: {MODEL_ID}")
print(f"Device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")



print("\n1. Loading BlenderBot from HuggingFace Hub...")
try:
    tokenizer = BlenderbotTokenizer.from_pretrained(MODEL_ID)
    model = BlenderbotForConditionalGeneration.from_pretrained(MODEL_ID)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    model.eval()
    
    print(f"   BlenderBot loaded ({sum(p.numel() for p in model.parameters()):,} parameters)")
except Exception as e:
    print(f"   Error loading BlenderBot: {e}")
    exit()

print("\n2. Loading RoBERTa emotion detector...")
try:
    emotion_classifier = hf_pipeline(
        "text-classification",
        model="SamLowe/roberta-base-go_emotions",
        device=0 if torch.cuda.is_available() else -1
    )
    print("   RoBERTa loaded")
except Exception as e:
    print(f"  Error loading RoBERTa: {e}")
    exit()

print("\n3. Initializing Groq LLM...")
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        print(" Groq initialized")
    except Exception as e:
        print(f" Groq not available: {e}")
        groq_client = None
else:
    print(" GROQ_API_KEY not set")
    groq_client = None

# ===== PERSONA SYSTEM =====

PERSONA_SYSTEM_PROMPTS = {
    'dad': """You are a caring, protective father figure. 
- Warm but authoritative
- Offers practical advice and solutions
- Shows concern mixed with humor
- Uses "son/daughter" occasionally
- Gives guidance like a parent would
- Encouraging but realistic
- Example tone: "Listen, I can see why you're worried. Here's what I'd do..."
""",
    
    'mom': """You are a nurturing, empathetic mother figure.
- Deeply caring and supportive
- Validates feelings first, then offers help
- Uses terms of endearment naturally
- Very attentive to emotional needs
- Offers comfort alongside practical support
- Warm humor when appropriate
- Example tone: "Oh honey, that sounds really tough. It's okay to feel this way. Let's figure this out together..."
""",
    
    'friend': """You are a supportive, relatable friend.
- Casual and conversational tone
- Validates without judgment
- Offers both humor and support
- Speaks from personal perspective sometimes
- Willing to be vulnerable
- Fun but genuine
- Example tone: "Ugh, that sucks. But hey, you've got this! Want to talk it through?"
""",
    
    'sister': """You are a caring, relatable older/younger sister.
- Mix of playful teasing and genuine support
- Understands you deeply
- Practical but also emotional
- Can be direct when needed
- Shared experiences and inside jokes
- Fiercely loyal
- Example tone: "I feel you. Okay but also here's what I think... and you know I'm right"
""",
    
    'mentor': """You are a wise, experienced mentor figure.
- Patient and educational
- Asks good questions to help you think
- Shares experience without being preachy
- Challenges you to grow
- Supportive but honest
- Focuses on learning and development
- Example tone: "I understand. When I faced something similar... What do you think would happen if...?"
""",
}

# ===== EMOTION MAPPING =====
EMOTION_STYLE = {
    'admiration': 'celebrate',
    'amusement': 'celebrate',
    'joy': 'celebrate',
    'excitement': 'celebrate',
    'sadness': 'listen',
    'disappointment': 'listen',
    'shame': 'listen',
    'grief': 'listen',
    'anger': 'distract',
    'annoyance': 'distract',
    'disapproval': 'distract',
    'disgust': 'distract',
    'fear': 'reassure',
    'nervousness': 'reassure',
    'surprise': 'engage',
    'neutral': 'supportive',
}

# ===== SURVEY RULES =====
SURVEY_RULES = {
    'anxious': {
        'tone': 'calm and structured',
        'do': 'Break the problem into small steps. Create a plan.',
        'avoid': "Do not say 'you will be fine' without addressing the concern.",
    },
    'sadness': {
        'tone': 'gentle and validating',
        'do': 'Listen first. Validate the feeling deeply.',
        'avoid': "Do not give unsolicited advice. Let them feel.",
    },
    'anger': {
        'tone': 'understanding and calm',
        'do': 'Acknowledge the frustration. Validate the anger.',
        'avoid': "Do not dismiss the anger. Do not take sides.",
    },
    'joy': {
        'tone': 'celebratory and warm',
        'do': 'Share in the excitement. Amplify the good feeling.',
        'avoid': "Do not downplay the achievement.",
    },
    'fear': {
        'tone': 'reassuring and grounding',
        'do': 'Provide reassurance. Help them feel safe.',
        'avoid': "Do not minimize the fear.",
    },
}

print("\n" + "="*80)
print("✅ ML SERVICE INITIALIZED")
print("="*80 + "\n")

# ===== FASTAPI APP =====

app = FastAPI(
    title="EmoConversational ML Service",
    description="BlenderBot + RoBERTa + Groq for empathetic responses"
)

# ===== DATA MODELS =====

class UserInput(BaseModel):
    text: str
    persona: str = 'friend'  # Default persona

class ResponseOutput(BaseModel):
    emotion: str
    emotion_confidence: float
    style: str
    persona: str
    base_response: str
    final_response: str

# ===== UTILITY FUNCTIONS =====

def detect_emotion(text: str):
    """Auto-detect emotion using RoBERTa."""
    try:
        if not text or len(text.strip()) == 0:
            return 'neutral', 0.5
        
        result = emotion_classifier(text, top_k=1)[0][0]
        label = result['label'].lower()
        confidence = result['score']
        
        return label, confidence
    except Exception as e:
        print(f"Emotion detection error: {e}")
        return 'neutral', 0.5

def generate_blenderbot_response(emotion: str, style: str, user_input: str):
    """Generate response using fine-tuned BlenderBot."""
    try:
        prompt = f"[EMOTION] {emotion} [STYLE] {style} [CONTEXT] {user_input}"
        
        inputs = tokenizer(
            prompt,
            return_tensors='pt',
            max_length=128,
            truncation=True
        ).to(device)
        
        with torch.no_grad():
            output = model.generate(
                inputs['input_ids'],
                max_new_tokens=80,
                num_beams=4,
                no_repeat_ngram_size=3,
                early_stopping=True,
            )
        
        response = tokenizer.decode(output[0], skip_special_tokens=True).strip()
        return response
    except Exception as e:
        print(f"BlenderBot generation error: {e}")
        return "I understand. Tell me more about what you're feeling."

def refine_with_groq(base_response: str, emotion: str, user_input: str, persona: str):
    """Refine with Groq + persona customization."""
    if not groq_client:
        return base_response  # Return base if Groq not available
    
    try:
        # Validate persona
        if persona not in PERSONA_SYSTEM_PROMPTS:
            persona = 'friend'  # Default to friend if invalid
        
        rules = SURVEY_RULES.get(emotion, {
            'tone': 'supportive',
            'do': 'Be empathetic',
            'avoid': 'Be generic'
        })
        
        # PERSONA-SPECIFIC SYSTEM MESSAGE
        persona_prompt = PERSONA_SYSTEM_PROMPTS[persona]
        
        system_msg = f"""{persona_prompt}

Detected emotion: {emotion}

Student preferences for {emotion}:
- Tone: {rules['tone']}
- Do: {rules['do']}
- Avoid: {rules['avoid']}

Instructions:
- Maximum 2-3 sentences
- Sound natural and human, matching {persona}'s style
- Never use phrases like "As an AI" or "I understand your feelings"
- Match the emotion level and {persona}'s characteristic response style
- BE AUTHENTIC TO THE {persona.upper()} PERSONA
"""
        
        user_msg = f"""User said: "{user_input}"

A base empathetic response was generated: "{base_response}"

Refine this response to:
1. Match {persona}'s personality and communication style
2. Match the tone preferences above
3. Feel natural and genuine to {persona}
4. Stay 2-3 sentences max

Respond as {persona} would. Be yourself."""
        
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {'role': 'system', 'content': system_msg},
                {'role': 'user', 'content': user_msg},
            ],
            max_tokens=150,
            temperature=0.8,  # Slightly higher for personality
        )
        
        refined = response.choices[0].message.content.strip()
        return refined
    except Exception as e:
        print(f"Groq refinement error: {e}")
        return base_response

# ===== ENDPOINTS =====

@app.get("/")
async def health():
    """Health check endpoint."""
    return {
        "status": "alive",
        "model": MODEL_ID,
        "groq_available": groq_client is not None,
        "personas": list(PERSONA_SYSTEM_PROMPTS.keys())
    }

@app.post("/chat", response_model=ResponseOutput)
async def generate_response(data: UserInput):
    """
    Generate empathetic response using full pipeline:
    1. Detect emotion (RoBERTa)
    2. Generate response (BlenderBot)
    3. Refine with persona (Groq)
    """
    try:
        # Validate input
        if not data.text or len(data.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Empty text input")
        
        # Validate persona
        if data.persona not in PERSONA_SYSTEM_PROMPTS:
            raise HTTPException(status_code=400, detail=f"Invalid persona. Valid personas: {list(PERSONA_SYSTEM_PROMPTS.keys())}")
        
        # Stage 1: Emotion detection
        emotion, emotion_conf = detect_emotion(data.text)
        style = EMOTION_STYLE.get(emotion, 'supportive')
        
        # Stage 2: BlenderBot generation
        base_response = generate_blenderbot_response(emotion, style, data.text)
        
        # Stage 3: Groq refinement with PERSONA
        final_response = refine_with_groq(base_response, emotion, data.text, data.persona)
        
        return ResponseOutput(
            emotion=emotion,
            emotion_confidence=emotion_conf,
            style=style,
            persona=data.persona,
            base_response=base_response,
            final_response=final_response
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_response: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_emotion")
async def detect_emotion_endpoint(data: UserInput):
    """Detect emotion only."""
    emotion, confidence = detect_emotion(data.text)
    return {
        "emotion": emotion,
        "confidence": confidence,
        "style": EMOTION_STYLE.get(emotion, 'supportive')
    }

@app.get("/personas")
async def get_personas():
    """Get available personas."""
    return {
        "personas": {
            name: prompt.split('\n')[0]  # First line is the description
            for name, prompt in PERSONA_SYSTEM_PROMPTS.items()
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )