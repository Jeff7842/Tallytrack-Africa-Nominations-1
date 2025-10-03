// public/Assets/js/mpesa-payment.js (updated)
(function () {
  function normalizeLocalPhone(p) {
    if (!p) return null;
    p = String(p).trim();
    if (/^07\d{8}$/.test(p)) return '254' + p.slice(1);
    if (/^2547\d{8}$/.test(p)) return p;
    if (/^\+2547\d{8}$/.test(p)) return p.replace('+','');
    return null;
  }

  function showToast(msg, isError = false) {
    if (window.showVoteError) { window.showVoteError(msg); return; }
    console[isError ? 'warn' : 'log'](msg);
    const el = document.getElementById('feedback') || document.createElement('div');
    el.textContent = msg;
    el.style.color = isError ? '#e03' : '#0a0';
  }

  function showErrorModal(message) {
    const m = document.getElementById('error-modal');
    if (!m) { showToast('Error: ' + message, true); return; }
    const rm = m.querySelector('.result-message');
    if (rm) rm.textContent = message;
    m.classList.add('active');
    m.setAttribute('aria-hidden','false');
  }

  function showSuccessModal(message) {
    const m = document.getElementById('success-modal');
    if (!m) { showToast(message, false); return; }
    const rm = m.querySelector('.result-message');
    if (rm) rm.textContent = message;
    m.classList.add('active');
    m.setAttribute('aria-hidden','false');
  }

  async function pollStatus(checkoutRequestID, attempts = 20, interval = 3000) {
    for (let i = 0; i < attempts; i++) {
      try {
        const r = await fetch(`/payment-status?checkoutRequestId=${encodeURIComponent(checkoutRequestID)}`);
        if (r.ok) {
          const j = await r.json();
          if (j.success && j.data) {
            const status = (j.data.status || '').toString().toLowerCase();
            if (status === 'completed' || status === 'COMPLETED') return { ok: true, data: j.data };
            if (status === 'failed' || status === 'FAILED') return { ok: false, data: j.data };
          }
        } else {
          // server returned 404/500, keep polling short while backend finishes
          const text = await r.text().catch(()=>null);
          console.warn('payment-status non-ok', r.status, text);
        }
      } catch (err) {
        console.warn('pollStatus fetch error', err);
      }
      await new Promise(r => setTimeout(r, interval));
    }
    return { ok: false, timeout: true };
  }

  async function init() {
    const proceedBtn = document.getElementById('proceed-payment');
    if (!proceedBtn) return;

    proceedBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const phoneInput = document.getElementById('phone');
      const voteCountEl = document.getElementById('vote-count');
      const votes = Number(voteCountEl?.value || 1);
      const phoneRaw = phoneInput?.value?.trim();
      const phone = normalizeLocalPhone(phoneRaw);
      const nominee_id =document.getElementById('nominee-id')
      const nominee_name =document.getElementById('nominee-name')

      if (!phone) {
        showToast('Please enter a valid phone number (07XXXXXXXX)', true);
        phoneInput?.classList.add('invalid');
        return;
      }

      proceedBtn.disabled = true;
      proceedBtn.classList.add('btn-loading');
      showToast('Sending STK push to your phone. Wait for the M-Pesa prompt...', false);

      try {
        const amount = votes * 10;
        const resp = await fetch('/stkpush', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone, 
            amount,
            nominee_id: window.currentNomineeId,
  nominee_name: window.currentNomineeName,
            accountReference: window.currentNomineeId,
            transactionDesc: `Vote for ${window.currentNomineeName}`
          })
        });

        const json = await resp.json().catch(()=>({}));
        if (!resp.ok || !json.success) {
          const err = json.error || json;
          const emsg = err?.errorMessage || err?.message || JSON.stringify(err);
          showToast('Failed to start STK push: ' + emsg, true);
          proceedBtn.disabled = false;
          proceedBtn.classList.remove('btn-loading');
          return;
        }

        const checkoutRequestID = json.checkoutRequestID || json.data?.CheckoutRequestID || json.raw?.CheckoutRequestID || null;
        if (!checkoutRequestID) {
          showToast('No CheckoutRequestID returned by server. Check backend logs.', true);
          proceedBtn.disabled = false;
          proceedBtn.classList.remove('btn-loading');
          return;
        }

        showToast('STK sent waiting for confirmation. Do not press Pay again.', false);
        const poll = await pollStatus(checkoutRequestID, 30, 3000);

        if (poll.timeout) {
          showToast('Payment still pending after timeout. Please check your phone and try again.', true);
          proceedBtn.disabled = false;
          proceedBtn.classList.remove('btn-loading');
          return;
        }

        if (!poll.ok) {
          const errMsg = poll.data?.failureReason || poll.data?.lastCallback?.resultDesc || 'Payment failed';
          showErrorModal(errMsg);
          proceedBtn.disabled = false;
          proceedBtn.classList.remove('btn-loading');
          return;
        }

        // Completed
        const successMessage = `Payment confirmed received.`;
        // attempt server-side finalization or client refresh
        if (typeof window.processVotePayment === 'function') {
          try {
            await window.processVotePayment(); // allow your function to refresh UI and maybe show its own modal
            // show success after process completes
            showSuccessModal(successMessage);
          } catch (err) {
            console.error('processVotePayment error', err);
            showSuccessModal(successMessage + ' (vote record may need manual reconciliation)');
          }
        } else {
          showSuccessModal(successMessage);
        }
      } catch (err) {
        console.error('mpesa flow error', err);
        showToast('Network/server error while initiating payment.', true);
      } finally {
        proceedBtn.disabled = false;
        proceedBtn.classList.remove('btn-loading');
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// End of public/Assets/js/mpesa-payment.js
