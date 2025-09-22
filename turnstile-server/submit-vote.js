// inside the proceed button handler (before you were inserting directly to Supabase)
try {
  // require captchaToken to be set
  if (!captchaToken) { showVoteError('Complete the captcha first'); return; }

  const res = await fetch(`${BACKEND_URL}/submit-vote`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: captchaToken,
    nominee_id: currentNomineeId,      // still keep the ID for FK consistency
    nominee_name: currentNomineeName,  // 👈 send nominee name instead of phone
    votes_count: votes
  })
});

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'submit failed');

  // success: show success modal, or proceed to payment flow (MPESA)
  document.getElementById('voting-modal').classList.remove('active');
  document.getElementById('success-modal').classList.add('active');
} catch (err) {
  console.error('submit-vote error', err);
  showVoteError('Unable to record your vote. Try again.');
}
