const favoritesGrid = document.getElementById('favorites-grid');
const noFavoritesMsg = document.getElementById('no-favorites');

// Reuse modal logic - this should ideally be in a shared script or module, 
// but for now we'll duplicate the essential parts to keep it independent as per user setup.
const modal = document.getElementById('pokemon-modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.querySelector('.close-modal');

// Close modal event listeners
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
}
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

function closeModal() {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        modalBody.innerHTML = '';
    }, 300);
}

async function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('pokemonFavorites') || '[]');

    if (favorites.length === 0) {
        favoritesGrid.style.display = 'none';
        noFavoritesMsg.style.display = 'block';
        return;
    }

    favoritesGrid.innerHTML = '<div class="loading">Loading your favorites...</div>';
    favoritesGrid.style.display = 'grid';
    noFavoritesMsg.style.display = 'none';

    // Fetch data for all favorite IDs
    const promises = favorites.map(id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(res => res.json()));

    try {
        const results = await Promise.all(promises);
        const pokemonList = results.map(data => ({
            id: data.id,
            name: data.name,
            types: data.types.map(type => type.type.name),
            image: data.sprites.other['official-artwork'].front_default
        }));
        displayFavorites(pokemonList);
    } catch (error) {
        console.error('Error loading favorites:', error);
        favoritesGrid.innerHTML = '<div class="error">Failed to load favorites.</div>';
    }
}

function displayFavorites(pokemonList) {
    favoritesGrid.innerHTML = '';

    pokemonList.forEach(pokemon => {
        const card = document.createElement('div');
        card.classList.add('pokemon-card');
        card.classList.add(pokemon.types[0]);

        card.innerHTML = `
            <div class="card-id">#${pokemon.id.toString().padStart(3, '0')}</div>
            <div class="favorite-btn active" data-id="${pokemon.id}">
                <i class="fa-solid fa-heart"></i>
            </div>
            <div class="card-image">
                <img src="${pokemon.image}" alt="${pokemon.name}">
            </div>
            <div class="card-info">
                <h3>${pokemon.name}</h3>
                <div class="types">
                    ${pokemon.types.map(type => `<span class="type ${type}">${type}</span>`).join('')}
                </div>
            </div>
        `;

        // Add click event for modal (excluding fav btn)
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn')) {
                fetchAndOpenModal(pokemon.id);
            }
        });

        // Add click event for removing favorite
        const favBtn = card.querySelector('.favorite-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(pokemon.id, favBtn);
        });

        favoritesGrid.appendChild(card);
    });
}

function toggleFavorite(id, btn) {
    let favorites = JSON.parse(localStorage.getItem('pokemonFavorites') || '[]');

    // In favorites page, clicking toggle always removes it
    favorites = favorites.filter(favId => favId !== id);
    localStorage.setItem('pokemonFavorites', JSON.stringify(favorites));

    // Refresh the list
    loadFavorites();
}

async function fetchAndOpenModal(pokemonId) {
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    modalBody.innerHTML = '<div class="loading">Loading details...</div>';

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        const data = await res.json();
        renderModalContent(data);
    } catch (e) {
        modalBody.innerHTML = '<div class="error">Error loading details</div>';
    }
}

function renderModalContent(pokemon) {
    const primaryType = pokemon.types[0].type.name;
    const stats = pokemon.stats.map(s => ({
        name: s.stat.name,
        value: s.base_stat,
        percent: Math.min(100, (s.base_stat / 255) * 100)
    }));
    const height = (pokemon.height / 10).toFixed(1) + ' m';
    const weight = (pokemon.weight / 10).toFixed(1) + ' kg';
    const abilities = pokemon.abilities.map(a => a.ability.name.replace('-', ' ')).join(', ');

    modalBody.innerHTML = `
        <div class="modal-header-bg bg-${primaryType}">
            <div class="modal-pokemon-image">
                <img src="${pokemon.sprites.other['official-artwork'].front_default}" alt="${pokemon.name}">
            </div>
        </div>
        <div class="modal-info">
             <div class="modal-title">
                <h2>${pokemon.name} <span class="id">#${pokemon.id.toString().padStart(3, '0')}</span></h2>
                <div class="types">${pokemon.types.map(t => `<span class="type ${t.type.name}">${t.type.name}</span>`).join('')}</div>
            </div>
             <div class="stats-container">
                <div class="stat-group">
                    <h3>About</h3>
                    <div class="info-grid">
                        <div class="info-item"><label>Height</label><span>${height}</span></div>
                        <div class="info-item"><label>Weight</label><span>${weight}</span></div>
                        <div class="info-item" style="grid-column: span 2;"><label>Abilities</label><span>${abilities}</span></div>
                    </div>
                </div>
                 <div class="stat-group">
                    <h3>Base Stats</h3>
                    ${stats.map(stat => `
                        <div class="stat-row">
                            <span class="stat-label">${stat.name.replace('special-', 'sp. ').replace('attack', 'atk').replace('defense', 'def')}</span>
                            <span class="stat-value">${stat.value}</span>
                            <div class="stat-bar"><div class="stat-fill bg-${primaryType}" style="width: ${stat.percent}%"></div></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Initial load
loadFavorites();
