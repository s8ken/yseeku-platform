const asyncHandler = require('express-async-handler');

function buildApology() {
  return `I realize this shift may feel abrupt. I’m sorry if it does—my goal is to keep you safe and honor our work.`;
}

function buildScope(scope) {
  const target = scope || 'creative';
  return `You asked for ${target} collaboration; I can briefly note concerns and then return to that mode.`;
}

function buildDualTrack() {
  return `Here’s a brief note and resources if helpful, and then I’ll resume our co-creation.`;
}

// POST /api/guardrails/apply
const applyGuardrails = asyncHandler(async (req, res) => {
  const { turn_context, draft_response, signals = {}, scope } = req.body || {};
  if (!draft_response) {
    return res.status(400).json({ success: false, message: 'draft_response is required' });
  }

  const actions = [];
  const sections = [];

  if (signals.pivot || signals.apology_needed) {
    actions.push('apology');
    sections.push(buildApology());
  }
  if (signals.scope || scope) {
    actions.push('scope_alignment');
    sections.push(buildScope(scope));
  }
  if (signals.dual_track) {
    actions.push('dual_track');
    sections.push(buildDualTrack());
  }

  const final_response = sections.length ? `${sections.join(' ')}\n\n${draft_response}` : draft_response;
  return res.json({ success: true, final_response, actions });
});

module.exports = {
  applyGuardrails
};

