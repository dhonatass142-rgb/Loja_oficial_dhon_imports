const firebaseConfig = {
  apiKey: "AIzaSyCikLgwPxMMPQ65tfX69GHB35bq16cfb2U",
  authDomain: "lojinha-dos-cria.firebaseapp.com",
  projectId: "lojinha-dos-cria",
  storageBucket: "lojinha-dos-cria.firebasestorage.app",
  messagingSenderId: "86338987483",
  appId: "1:86338987483:web:a1901eb218f747054ff3fe",
  measurementId: "G-8KX0KLK5EV"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const SENHA_ADMIN_MESTRA = "dhon2026"; 

document.addEventListener('DOMContentLoaded', () => {
    let products = [];
    let cart = JSON.parse(localStorage.getItem('dhon_cart')) || [];
    let currentCategory = null;
    let isAdminLoggedIn = localStorage.getItem('dhon_admin_logged') === 'true';

    const openModalBtn = document.getElementById('open-modal-btn');
    const productModal = document.getElementById('product-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const productForm = document.getElementById('product-form');
    const modalProductTitle = document.getElementById('modal-product-title');
    const submitBtn = document.getElementById('btn-save-submit');

    const loginAdminModal = document.getElementById('login-admin-modal');
    const adminLoginLink = document.getElementById('admin-login-link');
    const btnAccount = document.getElementById('btn-account');
    const closeLoginModal = document.getElementById('close-login-modal');
    const adminLoginForm = document.getElementById('admin-login-form');
    const userDisplay = document.getElementById('user-display');

    const productsContainer = document.getElementById('products-container');
    const searchInput = document.getElementById('search-input');
    const categoryView = document.getElementById('category-view');
    const featuredSection = document.getElementById('featured-section');
    const categoryProductsContainer = document.getElementById('category-products-container');
    const categoryTitle = document.getElementById('category-title');
    const categoryCount = document.getElementById('category-count');

    const drawerOverlay = document.getElementById('drawer-overlay');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const categoryListItems = document.querySelectorAll('.category-btn');

    const cartModal = document.getElementById('cart-modal');
    const btnCart = document.getElementById('btn-cart');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    function atualizarInterfaceAdmin() {
        if (isAdminLoggedIn) {
            if (openModalBtn) openModalBtn.style.display = 'flex';
            if (userDisplay) userDisplay.textContent = "Admin (Logado)";
            if (adminLoginLink) adminLoginLink.innerHTML = `<i class="fa-solid fa-lock-open" style="color:#4caf50;"></i> SAIR DO ADMIN`;
        } else {
            if (openModalBtn) openModalBtn.style.display = 'none';
            if (userDisplay) userDisplay.textContent = "Minha conta";
            if (adminLoginLink) adminLoginLink.innerHTML = `<i class="fa-solid fa-lock"></i> ÁREA RESTRITA (ADMIN)`;
        }
        renderProducts(products, productsContainer);
    }

    atualizarInterfaceAdmin();

    db.collection('products').onSnapshot((snapshot) => {
        products = [];
        snapshot.forEach((doc) => {
            products.push({ docId: doc.id, ...doc.data() });
        });
        renderProducts(products, productsContainer);
        if (currentCategory) {
            renderCategoryView(currentCategory);
        }
    }, (error) => {
        console.error("Erro ao carregar produtos do Firestore:", error);
    });

    function saveCartToLocalStorage() {
        localStorage.setItem('dhon_cart', JSON.stringify(cart));
    }

    function compressImage(file, maxWidth = 400, quality = 0.6) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = () => resolve(event.target.result);
            };
            reader.onerror = () => resolve("");
        });
    }

    function renderProducts(lista, container) {
        if (!container) return;
        container.innerHTML = '';
        if (lista.length === 0) {
            container.innerHTML = `<div class="empty-products" style="grid-column: 1 / -1;"><i class="fa-solid fa-box-open"></i>Nenhum produto cadastrado.</div>`;
            return;
        }

        lista.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const parcelamento = (product.price / 3).toFixed(2).replace('.', ',');

            card.innerHTML = `
                <div>
                    <img src="${product.img}" alt="${product.name}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'">
                    <span class="product-category">${product.category}</span>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.desc}</p>
                    </div>
                </div>
                <div>
                    <div class="product-price-box">
                        <div>
                            <span class="product-price">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</span>
                            <span class="product-installment">3x de R$ ${parcelamento} sem juros</span>
                        </div>
                        <button class="btn-buy" data-docid="${product.docId}" title="Adicionar ao Carrinho" type="button">
                            <i class="fa-solid fa-bag-shopping"></i>
                        </button>
                    </div>
                    <div class="admin-actions-bar ${isAdminLoggedIn ? 'active' : ''}">
                        <button class="btn-adm-edit" data-docid="${product.docId}" type="button">EDITAR</button>
                        <button class="btn-adm-del" data-docid="${product.docId}" type="button">EXCLUIR</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        container.querySelectorAll('.btn-buy').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const docId = e.currentTarget.getAttribute('data-docid');
                addToCart(docId);
            });
        });

        if (isAdminLoggedIn) {
            container.querySelectorAll('.btn-adm-del').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const docId = e.currentTarget.getAttribute('data-docid');
                    if (confirm('Tem certeza que deseja excluir este produto do Firebase?')) {
                        try {
                            await db.collection('products').doc(docId).delete();
                        } catch (error) {
                            alert('Erro ao excluir: ' + error.message);
                        }
                    }
                });
            });

            container.querySelectorAll('.btn-adm-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const docId = e.currentTarget.getAttribute('data-docid');
                    const prod = products.find(p => p.docId === docId);
                    if (prod) {
                        document.getElementById('prod-edit-id').value = prod.docId;
                        document.getElementById('prod-category').value = prod.category;
                        document.getElementById('prod-name').value = prod.name;
                        document.getElementById('prod-desc').value = prod.desc;
                        document.getElementById('prod-price').value = prod.price;
                        modalProductTitle.textContent = "EDITAR PRODUTO";
                        
                        if (submitBtn) {
                            submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> SALVAR PRODUTO`;
                            submitBtn.disabled = false;
                        }
                        productModal.classList.add('open');
                    }
                });
            });
        }
    }

    const navInicio = document.querySelector('nav a[data-nav="inicio"]');
    if (navInicio) {
        navInicio.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            navInicio.classList.add('active');
            currentCategory = null;
            if (categoryView) categoryView.classList.remove('active');
            if (featuredSection) featuredSection.style.display = 'block';
            if (searchInput) searchInput.value = '';
            renderProducts(products, productsContainer);
        });
    }

    const handleAdminAccessTrigger = (e) => {
        if (e) e.preventDefault();
        if (isAdminLoggedIn) {
            if (confirm('Deseja sair do painel administrativo?')) {
                isAdminLoggedIn = false;
                localStorage.removeItem('dhon_admin_logged');
                atualizarInterfaceAdmin();
                alert('Você saiu do painel.');
            }
        } else {
            loginAdminModal.classList.add('open');
        }
    };

    if (adminLoginLink) adminLoginLink.addEventListener('click', handleAdminAccessTrigger);
    if (btnAccount) btnAccount.addEventListener('click', handleAdminAccessTrigger);
    if (closeLoginModal) closeLoginModal.addEventListener('click', () => loginAdminModal.classList.remove('open'));

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const senhaInformada = document.getElementById('admin-password').value;

            if (senhaInformada === SENHA_ADMIN_MESTRA) {
                isAdminLoggedIn = true;
                localStorage.setItem('dhon_admin_logged', 'true');
                loginAdminModal.classList.remove('open');
                adminLoginForm.reset();
                atualizarInterfaceAdmin();
                alert('Login efetuado com sucesso!');
            } else {
                alert('Senha incorreta! Tente novamente.');
            }
        });
    }

    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const docId = document.getElementById('prod-edit-id').value;
            const fileInput = document.getElementById('prod-file');

            if (!docId && (!fileInput || fileInput.files.length === 0)) {
                alert('Selecione uma foto para o novo produto.');
                return;
            }

            if (submitBtn) {
                submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> SALVANDO NO FIREBASE...`;
                submitBtn.disabled = true;
            }

            try {
                let imageSrc = "";
                if (fileInput && fileInput.files.length > 0) {
                    imageSrc = await compressImage(fileInput.files[0], 400, 0.6);
                }

                if (docId) {
                    const updateData = {
                        category: document.getElementById('prod-category').value,
                        name: document.getElementById('prod-name').value,
                        desc: document.getElementById('prod-desc').value,
                        price: parseFloat(document.getElementById('prod-price').value)
                    };
                    if (imageSrc) updateData.img = imageSrc;

                    await db.collection('products').doc(docId).update(updateData);
                } else {
                    const newProduct = {
                        category: document.getElementById('prod-category').value,
                        name: document.getElementById('prod-name').value,
                        desc: document.getElementById('prod-desc').value,
                        price: parseFloat(document.getElementById('prod-price').value),
                        img: imageSrc
                    };
                    await db.collection('products').add(newProduct);
                }

                productForm.reset();
                document.getElementById('prod-edit-id').value = "";
                modalProductTitle.textContent = "CADASTRAR NOVO PRODUTO";
                if (productModal) productModal.classList.remove('open');
            } catch (error) {
                console.error("Erro ao salvar:", error);
                alert('Erro ao salvar produto: ' + error.message);
            } finally {
                if (submitBtn) {
                    submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> SALVAR PRODUTO`;
                    submitBtn.disabled = false;
                }
            }
        });
    }

    if (openModalBtn) {
        openModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (productForm) productForm.reset();
            document.getElementById('prod-edit-id').value = "";
            modalProductTitle.textContent = "CADASTRAR NOVO PRODUTO";
            if (submitBtn) {
                submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> SALVAR PRODUTO`;
                submitBtn.disabled = false;
            }
            productModal.classList.add('open');
        });
    }
    if (closeModalBtn && productModal) {
        closeModalBtn.addEventListener('click', () => productModal.classList.remove('open'));
    }

    if (menuToggleBtn && drawerOverlay) {
        menuToggleBtn.addEventListener('click', () => drawerOverlay.classList.add('open'));
    }
    if (closeDrawerBtn && drawerOverlay) {
        closeDrawerBtn.addEventListener('click', () => drawerOverlay.classList.remove('open'));
    }

    function renderCategoryView(categoryName) {
        currentCategory = categoryName;
        if (featuredSection) featuredSection.style.display = 'none';
        if (categoryView) categoryView.classList.add('active');

        if (categoryTitle) categoryTitle.textContent = categoryName;
        const filtered = products.filter(p => p.category === categoryName);
        if (categoryCount) categoryCount.textContent = `${filtered.length} produto(s) encontrado(s)`;
        renderProducts(filtered, categoryProductsContainer);
    }

    categoryListItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            categoryListItems.forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const cat = e.currentTarget.getAttribute('data-category');
            renderCategoryView(cat);
            if (drawerOverlay) drawerOverlay.classList.remove('open');
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            if (term === '') {
                if (currentCategory) {
                    renderCategoryView(currentCategory);
                } else {
                    if (featuredSection) featuredSection.style.display = 'block';
                    if (categoryView) categoryView.classList.remove('active');
                    renderProducts(products, productsContainer);
                }
            } else {
                if (featuredSection) featuredSection.style.display = 'block';
                if (categoryView) categoryView.classList.remove('active');
                const searched = products.filter(p => 
                    p.name.toLowerCase().includes(term) || 
                    p.desc.toLowerCase().includes(term) ||
                    p.category.toLowerCase().includes(term)
                );
                renderProducts(searched, productsContainer);
            }
        });
    }

    function addToCart(docId) {
        const product = products.find(p => p.docId === docId);
        if (!product) return;
        const existingItem = cart.find(item => item.docId === docId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCartToLocalStorage();
        renderCart();
        if (cartModal) cartModal.classList.add('open');
    }

    function renderCart() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        let total = 0, totalItens = 0;
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<div class="empty-products"><i class="fa-solid fa-bag-shopping"></i>Carrinho vazio.</div>`;
            if (cartTotal) cartTotal.textContent = 'R$ 0,00';
            if (cartCount) cartCount.textContent = '0';
            return;
        }
        cart.forEach((item, index) => {
            total += (Number(item.price) || 0) * item.quantity;
            totalItens += item.quantity;
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.img}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span>R$ ${Number(item.price).toFixed(2).replace('.', ',')} (x${item.quantity})</span>
                </div>
                <button class="cart-remove" data-index="${index}" type="button"><i class="fa-solid fa-trash"></i></button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
        if (cartCount) cartCount.textContent = totalItens;
        if (cartTotal) cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        cartItemsContainer.querySelectorAll('.cart-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = Number(e.currentTarget.getAttribute('data-index'));
                cart.splice(index, 1);
                saveCartToLocalStorage();
                renderCart();
            });
        });
    }

    if (btnCart) {
        btnCart.addEventListener('click', (e) => {
            e.preventDefault();
            renderCart();
            if (cartModal) cartModal.classList.add('open');
        });
    }

    if (closeCartBtn && cartModal) {
        closeCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cartModal.classList.remove('open');
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (cart.length === 0) {
                alert('O seu carrinho está vazio!');
                return;
            }

            let mensagem = "Olá! Gostaria de finalizar meu pedido na Dhon Imports:\n";
            let total = 0;
            
            cart.forEach(item => {
                const subtotal = (Number(item.price) || 0) * item.quantity;
                mensagem += `- ${item.quantity}x ${item.name} (R$ ${subtotal.toFixed(2).replace('.', ',')})\n`;
                total += subtotal;
            });
            
            mensagem += `\n*Total Geral: R$ ${total.toFixed(2).replace('.', ',')}*`;
            
            const telefone = "5561996210117";
            
            // Criação de um link <a> programático invisível para forçar a abertura correta pelo navegador do app
            const linkWp = document.createElement('a');
            linkWp.href = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
            linkWp.target = '_blank';
            linkWp.rel = 'noopener noreferrer';
            
            document.body.appendChild(linkWp);
            linkWp.click();
            document.body.removeChild(linkWp);
        });
    }
});
