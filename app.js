(function () {
  const WHATSAPP_NUMBER = '75998298274';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  let cart = [];

  function getMesaFromUrl() {
    const url = new URL(window.location.href);
    const mesa = (url.searchParams.get('mesa') || '').trim();
    return mesa;
  }

  function buildMessage({ nomeProduto, preco }) {
    return [
      'Olá! Gostaria de pedir:',
      '',
      `*${nomeProduto}* - ${preco}`,
    ].join('\n');
  }

  function openWhatsApp(message) {
    const number = String(WHATSAPP_NUMBER).replace(/\D/g, '');
    const normalized = number.startsWith('55') ? number : `55${number}`;
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2400);
  }

  function updateCartCount() {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = String(cart.length);
  }

  function addToCart({ nomeProduto, preco }) {
    cart.push({ nomeProduto, preco, img: arguments[0].img });
    updateCartCount();
    showToast(`${nomeProduto} adicionado!`);
  }

  function buildCartMessage() {
    const lines = ['Olá! Gostaria de fazer um pedido:', ''];
    cart.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.nomeProduto} - ${item.preco}`);
    });

    const total = cart.reduce((acc, item) => acc + parsePrice(item.preco), 0);
    if (total > 0) {
      lines.push('', `Total: ${formatBRL(total)}`);
    }

    return lines.join('\n');
  }

  function parsePrice(preco) {
    if (!preco) return 0;
    const raw = String(preco)
      .replace(/\s/g, '')
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.');
    const val = Number.parseFloat(raw);
    return Number.isFinite(val) ? val : 0;
  }

  function formatBRL(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function toggleCart(open) {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    const shouldOpen = typeof open === 'boolean' ? open : modal.hasAttribute('hidden');
    if (shouldOpen) {
      modal.removeAttribute('hidden');
      renderCart();
      return;
    }
    modal.setAttribute('hidden', '');
  }

  function renderCart() {
    const empty = document.getElementById('cart-empty');
    const list = document.getElementById('cart-items');
    const sendBtn = document.getElementById('cart-send');
    const totalEl = document.getElementById('cart-total');
    if (!empty || !list || !sendBtn || !totalEl) return;

    list.innerHTML = '';
    const isEmpty = cart.length === 0;
    empty.hidden = !isEmpty;
    sendBtn.disabled = isEmpty;

    const total = cart.reduce((acc, item) => acc + parsePrice(item.preco), 0);
    if (total > 0) {
      totalEl.hidden = false;
      totalEl.innerHTML = `<span class="cart-total__label">Total</span><span class="cart-total__value">${formatBRL(total)}</span>`;
    } else {
      totalEl.hidden = true;
      totalEl.textContent = '';
    }

    if (isEmpty) return;

    cart.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'cart-item';

      const thumb = document.createElement('img');
      thumb.className = 'cart-item__img';
      thumb.alt = item.nomeProduto;
      thumb.loading = 'lazy';
      thumb.decoding = 'async';
      thumb.src = item.img || 'assets/produtos/placeholder.svg';
      thumb.addEventListener('error', () => {
        thumb.src = 'assets/produtos/placeholder.svg';
      });

      const left = document.createElement('div');
      left.className = 'cart-item__info';
      const name = document.createElement('p');
      name.className = 'cart-item__name';
      name.textContent = item.nomeProduto;
      const price = document.createElement('p');
      price.className = 'cart-item__price';
      price.textContent = item.preco;

      left.appendChild(name);
      left.appendChild(price);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'cart-item__remove';
      remove.textContent = 'Remover';
      remove.addEventListener('click', () => {
        cart.splice(idx, 1);
        updateCartCount();
        renderCart();
      });

      row.appendChild(thumb);
      row.appendChild(left);
      row.appendChild(remove);
      list.appendChild(row);
    });
  }

  function formatProdutoName(categoria, nome) {
    return categoria === 'pasteis' ? `Pastel de ${nome}` : nome;
  }

  function createCard({ categoriaKey, nome, preco, img }) {
    const article = document.createElement('article');
    article.className = 'produto-card';

    const media = document.createElement('div');
    media.className = 'produto-media';

    const image = document.createElement('img');
    image.loading = 'lazy';
    image.decoding = 'async';
    image.alt = nome;
    image.src = img || 'assets/produtos/placeholder.svg';
    image.addEventListener('error', () => {
      image.src = 'assets/produtos/placeholder.svg';
    });
    media.appendChild(image);

    const top = document.createElement('div');
    top.className = 'produto-top';

    const h3 = document.createElement('h3');
    h3.className = 'produto-nome';
    h3.textContent = nome;

    const pPreco = document.createElement('p');
    pPreco.className = 'preco';
    pPreco.textContent = preco;

    top.appendChild(h3);
    top.appendChild(pPreco);

    const actions = document.createElement('div');
    actions.className = 'produto-actions';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-adicionar';
    addBtn.dataset.produto = formatProdutoName(categoriaKey, nome);
    addBtn.dataset.img = img || 'assets/produtos/placeholder.svg';
    addBtn.textContent = 'Adicionar';
    addBtn.addEventListener('click', () => {
      addToCart({ nomeProduto: addBtn.dataset.produto, preco, img: addBtn.dataset.img });
    });

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-pedir';
    button.dataset.produto = formatProdutoName(categoriaKey, nome);

    button.textContent = 'Pedir no WhatsApp';

    button.addEventListener('click', () => {
      const msg = buildMessage({ nomeProduto: button.dataset.produto, preco });
      openWhatsApp(msg);
    });

    article.appendChild(media);
    article.appendChild(top);
    actions.appendChild(addBtn);
    actions.appendChild(button);
    article.appendChild(actions);

    return article;
  }

  function render() {
    const data = window.CARDAPIO_DATA;
    if (!data) return;

    const grids = {
      pasteis: $('#grid-pasteis'),
      salgados: $('#grid-salgados'),
      bebidas: $('#grid-bebidas')
    };

    Object.entries(grids).forEach(([key, grid]) => {
      const items = data[key] || [];
      if (!grid) return;

      items.forEach((item) => {
        grid.appendChild(createCard({ categoriaKey: key, nome: item.nome, preco: item.preco, img: item.img }));
      });
    });
  }

  function setupCategoryNav() {
    const tabs = $$('.categoria-tab');

    let ignoreObserverUntil = 0;

    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const categoria = btn.dataset.categoria;
        const section = document.getElementById(categoria);
        if (!section) return;

        ignoreObserverUntil = Date.now() + 900;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveTab(categoria);
      });
    });

    function setActiveTab(categoria) {
      tabs.forEach((b) => {
        const active = b.dataset.categoria === categoria;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    const sections = $$('.categoria');
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < ignoreObserverUntil) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        const categoria = visible.target.getAttribute('data-categoria');
        if (categoria) setActiveTab(categoria);
      },
      { root: null, threshold: [0.2, 0.35, 0.5, 0.7] }
    );

    sections.forEach((s) => observer.observe(s));

    const initialHash = (window.location.hash || '').replace('#', '');
    if (initialHash) setActiveTab(initialHash);
  }

  function setupWhatsAppButtons() {
    const headerBtn = document.getElementById('btn-whatsapp-header');
    const floatBtn = document.getElementById('whatsapp-float');
    const heroBtn = document.getElementById('btn-hero-whatsapp');
    const mesaBadge = document.getElementById('mesa-badge');

    const genericMsg = () => {
      return ['Olá! Quero fazer um pedido.'].join('\n');
    };

    const mesa = getMesaFromUrl();
    if (mesaBadge && mesa) {
      mesaBadge.textContent = `Mesa ${mesa}`;
      mesaBadge.hidden = false;
    }

    if (headerBtn) {
      headerBtn.addEventListener('click', () => openWhatsApp(genericMsg()));
    }

    if (floatBtn) {
      floatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openWhatsApp(genericMsg());
      });
    }

    if (heroBtn) {
      heroBtn.addEventListener('click', () => openWhatsApp(genericMsg()));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const cartBtn = document.getElementById('cart-button');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => toggleCart(true));
    }

    const cartClose = document.getElementById('cart-close');
    if (cartClose) cartClose.addEventListener('click', () => toggleCart(false));

    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));

    const cartClear = document.getElementById('cart-clear');
    if (cartClear) {
      cartClear.addEventListener('click', () => {
        if (!cart.length) {
          showToast('Seu carrinho está vazio.');
          return;
        }
        cart = [];
        updateCartCount();
        renderCart();
        showToast('Carrinho limpo.');
      });
    }

    const cartSend = document.getElementById('cart-send');
    if (cartSend) {
      cartSend.addEventListener('click', () => {
        if (!cart.length) {
          showToast('Seu carrinho está vazio.');
          return;
        }
        openWhatsApp(buildCartMessage());
      });
    }

    updateCartCount();
    render();
    setupCategoryNav();
    setupWhatsAppButtons();
  });
})();
