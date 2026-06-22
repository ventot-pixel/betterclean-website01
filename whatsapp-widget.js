(function () {
  const PHONE = '358415769236';
  const COPY = {
    fi: {
      openLabel: 'Avaa WhatsApp-yhteydenotto',
      closeLabel: 'Sulje WhatsApp-yhteydenotto',
      eyebrow: 'Nopea kysymys?',
      title: 'Kysy WhatsAppissa',
      body: 'Kerro mitä tarvitset, niin vastaamme mahdollisimman pian.',
      primary: 'Avaa WhatsApp',
      secondary: 'Pyydä tarjous',
      message: 'Hei BetterClean, haluaisin kysyä siivouksesta Tampereella.'
    },
    en: {
      openLabel: 'Open WhatsApp contact',
      closeLabel: 'Close WhatsApp contact',
      eyebrow: 'Quick question?',
      title: 'Ask on WhatsApp',
      body: 'Tell us what you need and we will reply as soon as possible.',
      primary: 'Open WhatsApp',
      secondary: 'Request quote',
      message: 'Hi BetterClean, I would like to ask about cleaning in Tampere.'
    }
  };

  function getLang() {
    const lang = (document.documentElement.lang || window.currentLang || 'fi').toLowerCase();
    return lang.indexOf('en') === 0 ? 'en' : 'fi';
  }

  function trackWhatsAppClick() {
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', 'WhatsAppClick');
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'whatsapp_click', {
        event_category: 'contact',
        event_label: 'floating_widget'
      });
    }
  }

  function installStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .bc-whatsapp-widget {
        position: fixed;
        right: 18px;
        bottom: calc(18px + env(safe-area-inset-bottom));
        z-index: 70;
        font-family: Inter, Arial, sans-serif;
      }

      .bc-whatsapp-panel {
        width: min(320px, calc(100vw - 32px));
        margin-bottom: 12px;
        padding: 18px;
        border: 1px solid rgba(17, 24, 39, 0.1);
        border-radius: 14px;
        background: #ffffff;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
        color: #172018;
        transform: translateY(8px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.18s ease, transform 0.18s ease;
      }

      .bc-whatsapp-widget.is-open .bc-whatsapp-panel {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }

      .bc-whatsapp-eyebrow {
        margin: 0 0 6px;
        color: #247a24;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .bc-whatsapp-title {
        margin: 0 0 8px;
        color: #101810;
        font-size: 1.05rem;
        font-weight: 800;
        letter-spacing: 0;
      }

      .bc-whatsapp-body {
        margin: 0 0 14px;
        color: #3f4b40;
        font-size: 0.94rem;
        line-height: 1.5;
      }

      .bc-whatsapp-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .bc-whatsapp-primary,
      .bc-whatsapp-secondary,
      .bc-whatsapp-toggle {
        appearance: none;
        border: 0;
        cursor: pointer;
        font: inherit;
      }

      .bc-whatsapp-primary,
      .bc-whatsapp-secondary {
        display: inline-flex;
        min-height: 42px;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        padding: 0 14px;
        font-size: 0.92rem;
        font-weight: 800;
        text-decoration: none;
        white-space: nowrap;
      }

      .bc-whatsapp-primary {
        background: #1f8f45;
        color: #ffffff;
        box-shadow: 0 10px 24px rgba(31, 143, 69, 0.26);
      }

      .bc-whatsapp-primary:focus-visible,
      .bc-whatsapp-secondary:focus-visible,
      .bc-whatsapp-toggle:focus-visible {
        outline: 3px solid rgba(31, 143, 69, 0.35);
        outline-offset: 3px;
      }

      .bc-whatsapp-secondary {
        border: 1px solid #d8ded8;
        background: #ffffff;
        color: #172018;
      }

      .bc-whatsapp-toggle {
        display: flex;
        width: 58px;
        height: 58px;
        margin-left: auto;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #1f8f45;
        color: #ffffff;
        box-shadow: 0 18px 38px rgba(31, 143, 69, 0.32);
        font-weight: 900;
        letter-spacing: 0;
      }

      .bc-whatsapp-toggle::after {
        content: "";
        position: absolute;
        right: 2px;
        top: 2px;
        width: 13px;
        height: 13px;
        border: 2px solid #ffffff;
        border-radius: 999px;
        background: #74d680;
      }

      @media (max-width: 640px) {
        .bc-whatsapp-widget {
          right: 14px;
          bottom: calc(14px + env(safe-area-inset-bottom));
        }

        .bc-whatsapp-panel {
          padding: 16px;
        }

        .bc-whatsapp-actions {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createWidget() {
    const root = document.createElement('aside');
    root.className = 'bc-whatsapp-widget';

    const panel = document.createElement('div');
    panel.className = 'bc-whatsapp-panel';
    panel.id = 'bc-whatsapp-panel';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'bc-whatsapp-eyebrow';

    const title = document.createElement('p');
    title.className = 'bc-whatsapp-title';

    const body = document.createElement('p');
    body.className = 'bc-whatsapp-body';

    const actions = document.createElement('div');
    actions.className = 'bc-whatsapp-actions';

    const primary = document.createElement('a');
    primary.className = 'bc-whatsapp-primary';
    primary.target = '_blank';
    primary.rel = 'noopener noreferrer';
    primary.addEventListener('click', trackWhatsAppClick);

    const secondary = document.createElement('a');
    secondary.className = 'bc-whatsapp-secondary';
    secondary.href = '/request-quote.html';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'bc-whatsapp-toggle';
    toggle.setAttribute('aria-controls', panel.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'WA';

    actions.append(primary, secondary);
    panel.append(eyebrow, title, body, actions);
    root.append(panel, toggle);
    document.body.appendChild(root);

    function setOpen(isOpen, options) {
      const shouldFocus = !options || options.focus !== false;
      root.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? COPY[getLang()].closeLabel : COPY[getLang()].openLabel);
      if (isOpen && shouldFocus) primary.focus({ preventScroll: true });
    }

    function updateCopy() {
      const copy = COPY[getLang()];
      eyebrow.textContent = copy.eyebrow;
      title.textContent = copy.title;
      body.textContent = copy.body;
      primary.textContent = copy.primary;
      primary.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(copy.message);
      secondary.textContent = copy.secondary;
      toggle.setAttribute('aria-label', root.classList.contains('is-open') ? copy.closeLabel : copy.openLabel);
    }

    toggle.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) setOpen(false);
    });

    updateCopy();
    new MutationObserver(updateCopy).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });

    window.setTimeout(() => setOpen(true, { focus: false }), 700);
  }

  if (document.querySelector('.bc-whatsapp-widget')) return;
  installStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget, { once: true });
  } else {
    createWidget();
  }
})();
