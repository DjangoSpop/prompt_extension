"""
Prompt Enhancement Service
Handles AI-powered prompt optimization with credit deduction
"""
from decimal import Decimal
from typing import Dict, Any
import openai
from django.conf import settings


class InsufficientCreditsError(Exception):
    """Raised when user doesn't have enough credits"""

    def __init__(self, required_credits: Decimal, current_credits: Decimal):
        self.required_credits = required_credits
        self.current_credits = current_credits
        super().__init__(
            f"Insufficient credits. Required: {required_credits}, Available: {current_credits}"
        )


class PromptEnhancementService:
    """
    Service for enhancing prompts using AI models
    """

    # Credit costs per model
    CREDIT_COSTS = {
        'gpt-4o-mini': Decimal('0.10'),
        'gpt-4o': Decimal('0.50'),
        'claude-3-5-sonnet-20241022': Decimal('0.75'),
        'claude-3-5-haiku-20241022': Decimal('0.25'),
    }

    # Style templates
    STYLE_TEMPLATES = {
        'concise': "Make this prompt more concise and direct while maintaining clarity:",
        'detailed': "Expand this prompt with more specific details and context:",
        'creative': "Enhance this prompt to be more creative and imaginative:",
        'technical': "Make this prompt more technical and precise:",
        'balanced': "Optimize this prompt for clarity, specificity, and effectiveness:",
    }

    def enhance_prompt(
        self,
        user,
        history,
        model: str,
        style: str = 'balanced'
    ) -> Dict[str, Any]:
        """
        Enhance a prompt using the specified model and style

        Args:
            user: The user object
            history: The PromptHistory object
            model: The model to use
            style: The enhancement style

        Returns:
            Dict with optimized_prompt, model, tokens, credits_spent
        """
        # Calculate credit cost
        credits_required = self.CREDIT_COSTS.get(model, Decimal('0.10'))

        # Check user credits
        user_credits = self._get_user_credits(user)
        if user_credits < credits_required:
            raise InsufficientCreditsError(credits_required, user_credits)

        # Get style template
        style_instruction = self.STYLE_TEMPLATES.get(style, self.STYLE_TEMPLATES['balanced'])

        # Build enhancement prompt
        enhancement_prompt = f"""
{style_instruction}

Original Prompt:
{history.original_prompt}

Enhanced Prompt (respond with only the enhanced prompt, no explanations):
"""

        # Call AI model
        if model.startswith('gpt-'):
            result = self._enhance_with_openai(enhancement_prompt, model)
        elif model.startswith('claude-'):
            result = self._enhance_with_anthropic(enhancement_prompt, model)
        else:
            raise ValueError(f"Unsupported model: {model}")

        # Deduct credits
        self._deduct_credits(user, credits_required)

        return {
            'optimized_prompt': result['text'],
            'model': model,
            'tokens': result['tokens'],
            'credits_spent': credits_required,
        }

    def _enhance_with_openai(self, prompt: str, model: str) -> Dict[str, Any]:
        """Enhance using OpenAI API"""
        client = openai.OpenAI(api_key=getattr(settings, 'OPENAI_API_KEY', ''))

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a prompt engineering expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500,
        )

        return {
            'text': response.choices[0].message.content.strip(),
            'tokens': response.usage.total_tokens,
        }

    def _enhance_with_anthropic(self, prompt: str, model: str) -> Dict[str, Any]:
        """Enhance using Anthropic API"""
        import anthropic

        client = anthropic.Anthropic(
            api_key=getattr(settings, 'ANTHROPIC_API_KEY', '')
        )

        response = client.messages.create(
            model=model,
            max_tokens=500,
            temperature=0.7,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        tokens = response.usage.input_tokens + response.usage.output_tokens

        return {
            'text': response.content[0].text.strip(),
            'tokens': tokens,
        }

    def _get_user_credits(self, user) -> Decimal:
        """Get user's current credit balance"""
        # This should integrate with your billing system
        # For now, return a mock value or query from user profile
        if hasattr(user, 'credits'):
            return Decimal(str(user.credits))

        # Mock credits for development
        return Decimal('100.00')

    def _deduct_credits(self, user, amount: Decimal):
        """Deduct credits from user's account"""
        # This should integrate with your billing system
        # For now, just update the user profile
        if hasattr(user, 'credits'):
            user.credits = Decimal(str(user.credits)) - amount
            user.save(update_fields=['credits'])

        # TODO: Create a transaction record in billing system
