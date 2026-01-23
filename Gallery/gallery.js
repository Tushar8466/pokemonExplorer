const pokemonGrid = document.getElementById('pokemon-grid');
const generationSelect = document.querySelector('select[name="generation"]');
const searchInput = document.querySelector('input[type="text"]');

const generations = {
    'generation-1': { start: 1, end: 151 },
    'generation-2': { start: 152, end: 251 },
    'generation-3': { start: 252, end: 386 },
    'generation-4': { start: 387, end: 493 },
    'generation-5': { start: 494, end: 649 },
    'generation-6': { start: 650, end: 721 },
    'generation-7': { start: 722, end: 809 },
    'generation-8': { start: 810, end: 905 }
};

let allPokemon = [];

async function fetchPokemon(start, end) {
    pokemonGrid.innerHTML = '<div class="loading">Loading Pokemon...</div>';
    allPokemon = [];

    const promises = [];
    for (let i = start; i <= end; i++) {
        promises.push(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(res => res.json()));
    }

    try {
        const results = await Promise.all(promises);
        allPokemon = results.map(data => ({
            id: data.id,
            name: data.name,
            types: data.types.map(type => type.type.name),
            image: data.sprites.other['official-artwork'].front_default
        }));
        displayPokemon(allPokemon);
    } catch (error) {
        console.error('Error fetching Pokemon:', error);
        pokemonGrid.innerHTML = '<div class="error">Failed to load Pokemon. Please try again.</div>';
    }
}

function displayPokemon(pokemonList) {
    pokemonGrid.innerHTML = '';

    if (pokemonList.length === 0) {
        pokemonGrid.innerHTML = '<div class="no-results">No Pokemon found</div>';
        return;
    }

    pokemonList.forEach(pokemon => {
        const card = document.createElement('div');
        card.classList.add('pokemon-card');
        card.classList.add(pokemon.types[0]);

        card.innerHTML = `
            <div class="card-id">#${pokemon.id.toString().padStart(3, '0')}</div>
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

        pokemonGrid.appendChild(card);
    });
}

generationSelect.addEventListener('change', (e) => {
    const gen = generations[e.target.value];
    if (gen) {
        fetchPokemon(gen.start, gen.end);
    }
});

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredPokemon = allPokemon.filter(pokemon =>
        pokemon.name.toLowerCase().includes(searchTerm) ||
        pokemon.id.toString().includes(searchTerm)
    );
    displayPokemon(filteredPokemon);
});

// Modal Logic
const modal = document.getElementById('pokemon-modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.querySelector('.close-modal');

// Close modal event listeners
closeModalBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

function closeModal() {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        modalBody.innerHTML = ''; // Clear content
    }, 300);
}

// Delegate click event to the grid to handle dynamic cards
pokemonGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.pokemon-card');
    if (!card) return;

    // Extract ID from the card content: #001 -> 1
    const pId = parseInt(card.querySelector('.card-id').textContent.replace('#', ''));

    // Find basic data from our local array
    // We will fetch more details now
    openModal(pId);
});

async function openModal(pokemonId) {
    modal.style.display = 'block';
    // Small delay to allow display:block to apply before opacity transition
    setTimeout(() => modal.classList.add('show'), 10);

    modalBody.innerHTML = '<div class="loading" style="width:100%; color: white;">Loading details...</div>';

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        const data = await res.json();

        // Fetch species data for flavor text if desired, but let's stick to basic details first
        // to keep it fast. Alternatively, we can fetch species too.

        renderModalContent(data);
    } catch (error) {
        console.error('Error fetching details:', error);
        modalBody.innerHTML = '<div class="error" style="width:100%; color: white;">Failed to load details.</div>';
    }
}

function renderModalContent(pokemon) {
    const primaryType = pokemon.types[0].type.name;
    const stats = pokemon.stats.map(s => ({
        name: s.stat.name,
        value: s.base_stat,
        percent: Math.min(100, (s.base_stat / 255) * 100) // 255 is max base stat roughly
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
                <div class="types">
                    ${pokemon.types.map(t => `<span class="type ${t.type.name}">${t.type.name}</span>`).join('')}
                </div>
            </div>
            
            <div class="stats-container">
                <div class="stat-group">
                    <h3>About</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Height</label>
                            <span>${height}</span>
                        </div>
                        <div class="info-item">
                            <label>Weight</label>
                            <span>${weight}</span>
                        </div>
                        <div class="info-item" style="grid-column: span 2;">
                            <label>Abilities</label>
                            <span>${abilities}</span>
                        </div>
                    </div>
                </div>
                
                <div class="stat-group">
                    <h3>Base Stats</h3>
                    ${stats.map(stat => `
                        <div class="stat-row">
                            <span class="stat-label">${stat.name.replace('special-', 'sp. ').replace('attack', 'atk').replace('defense', 'def')}</span>
                            <span class="stat-value">${stat.value}</span>
                            <div class="stat-bar">
                                <div class="stat-fill bg-${primaryType}" style="width: ${stat.percent}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Initial load (Generation 1)
fetchPokemon(1, 151);
