// ==================== CONFIGURAÇÃO DO FIREBASE ====================
const firebaseConfig = {
    apiKey: "AIzaSyA6YNv3Hx-TtvawqnxW5hKTXllp73vLLf8",
    authDomain: "please-a881f.firebaseapp.com",
    databaseURL: "https://please-a881f-default-rtdb.firebaseio.com",
    projectId: "please-a881f",
    storageBucket: "please-a881f.firebasestorage.app",
    messagingSenderId: "124810010305",
    appId: "1:124810010305:web:6671cb2eb4e1d5ad7afe40",
    measurementId: "G-YK57NTDZ8Z"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
// ==================================================================

// ==================== CONFIGURAÇÕES DO APP ====================
// Cronómetro zerado: começa a contar a partir do momento atual em que a app inicia
const DATA_NAMORO = new Date(); 

const opcoesRoleta = [
    "🍕 Noite da Pizza & Filme",
    "🍣 Jantar de Sushi Namorados",
    "🍿 Cinema com Pipoca Grande",
    "🍦 Noite do Sorvete",
    "🍔 Hambúrguer Artesanal",
    "☕ Café Charmoso de Tarde",
    "🎳 Noite de Jogos ou Bilhar",
    "🍳 Cozinhar algo juntos"
];
// ==============================================================

// Variáveis Globais de Estado (Serão preenchidas pelo Firebase)
let moedas = 0;
let missoes = [];
let encontroMarcado = null;
let itensMural = [];

// Escutar dados do Firebase em Tempo Real (Sincronização entre aparelhos)
document.addEventListener("DOMContentLoaded", () => {
    // 1. Sincroniza o Mural Vivo
    database.ref('mural').on('value', (snapshot) => {
        const dados = snapshot.val();
        itensMural = dados ? Object.keys(dados).map(key => ({ id: key, ...dados[key] })) : [];
        renderizarMural();
    });

    // 2. Sincroniza o Encontro Marcado
    database.ref('encontro').on('value', (snapshot) => {
        encontroMarcado = snapshot.val();
        renderizarEncontro();
    });

    // 3. Sincroniza as Moedas
    database.ref('moedas').on('value', (snapshot) => {
        moedas = snapshot.val() || 0;
        document.getElementById('moedas-count').innerText = moedas;
    });

    // 4. Sincroniza as Missões
    database.ref('missoes').on('value', (snapshot) => {
        const dados = snapshot.val();
        if (dados) {
            missoes = dados;
            renderizarMissoes();
        } else {
            const iniciais = [
                { id: 1, titulo: "Mensagem de bom dia fofa", recompensa: 10, concluida: false },
                { id: 2, titulo: "Me mandar uma foto do seu sorriso hoje", recompensa: 15, concluida: false },
                { id: 3, titulo: "Preparar ou escolher o lanche do date", recompensa: 25, concluida: false },
                { id: 4, titulo: "Massagem de 15 minutos sem reclamar", recompensa: 30, concluida: false }
            ];
            database.ref('missoes').set(iniciais);
        }
    });

    verificarAniversario();
    renderizarLoja(); 
    setInterval(atualizarContadorCompleto, 1000);
    atualizarContadorCompleto();
});

// NOVA FUNÇÃO PARA EXIBIR AVISOS NO MEIO DA TELA (POP-UP)
function mostrarAviso(texto) {
    const container = document.getElementById('custom-toast-container');
    const toastCard = document.getElementById('custom-toast');
    
    if(!container || !toastCard) return;
    
    toastCard.innerText = texto;
    container.style.display = 'flex';
    
    setTimeout(() => {
        container.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        container.classList.remove('show');
        setTimeout(() => {
            container.style.display = 'none';
        }, 250);
    }, 3500);
}

// ENGINE DO MURAL DEDICADO (RENDERIZAR DO BANCO DE DADOS)
function renderizarMural() {
    const container = document.getElementById('mural-container');
    if (!container) return;
    
    container.innerHTML = '';

    if (itensMural.length === 0) {
        container.innerHTML = `
            <p style="color: var(--text-muted); font-size: 0.9rem; font-style: italic; text-align: center; width: 100%; padding-top: 40px;">
                O mural está vazio. Adicione a primeira foto ou vídeo de vocês! 📸
            </p>
        `;
        return;
    }

    itensMural.forEach(item => {
        const elementoPolaroid = document.createElement('div');
        elementoPolaroid.className = 'polaroid';
        
        let midiaHTML = '';
        if (item.tipo === "video") {
            midiaHTML = `<div class="photo-placeholder"><video src="${item.url}" autoplay loop muted playsinline></video></div>`;
        } else {
            midiaHTML = `<div class="photo-placeholder" style="background-image: url('${item.url}'); background-size: cover; background-position: center;"></div>`;
        }

        elementoPolaroid.innerHTML = `
            <button class="delete-media-btn" onclick="removerMidiaMural('${item.id}')">×</button>
            ${midiaHTML}
            <div class="polaroid-caption">${item.legenda}</div>
        `;
        container.appendChild(elementoPolaroid);
    });
}

function abrirModalGerenciarMural() {
    document.getElementById('modal-mural').style.display = 'flex';
}

function fecharModalMural() {
    document.getElementById('modal-mural').style.display = 'none';
}

// SALVAR MÍDIA VIA UPLOAD (FIREBASE STORAGE + REALTIME DATABASE)
function salvarMidiaMural() {
    const elFile = document.getElementById('mural-file');
    const elLegenda = document.getElementById('mural-legenda');

    if (!elFile || !elLegenda) {
        mostrarAviso("❌ Erro técnico: Elementos do formulário não encontrados!");
        return;
    }

    const ficheiro = elFile.files[0];
    const legenda = elLegenda.value.trim();

    if (!ficheiro) {
        mostrarAviso("❌ Por favor, selecione uma foto ou vídeo!");
        return;
    }

    if (!legenda) {
        mostrarAviso("❌ Insira uma legenda para a sua lembrança!");
        return;
    }

    // Identifica dinamicamente se o arquivo anexado é foto ou vídeo
    const tipo = ficheiro.type.includes('video') ? 'video' : 'foto';

    mostrarAviso("⏳ Enviando arquivo para a nuvem... Aguarde.");

    // 1. Gera um nome único para o arquivo no Storage para evitar sobreposições
    const nomeUnico = Date.now() + "_" + ficheiro.name;
    const storageRef = firebase.storage().ref('mural/' + nomeUnico);

    // 2. Executa o upload do anexo
    storageRef.put(ficheiro).then((snapshot) => {
        // 3. Captura a URL pública definitiva gerada pelo Firebase
        return snapshot.ref.getDownloadURL();
    }).then((urlGerada) => {
        // 4. Salva a URL e os metadados estruturados no Realtime Database
        return database.ref('mural').push({
            tipo: tipo,
            url: urlGerada,
            legenda: legenda
        });
    }).then(() => {
        fecharModalMural();
        mostrarAviso("📸 Lembrança sincronizada com sucesso no mural!");
        
        // Limpa o formulário
        elFile.value = '';
        elLegenda.value = '';
    }).catch((erro) => {
        console.error("Erro no upload do arquivo:", erro);
        mostrarAviso("❌ Falha ao carregar o arquivo para a nuvem.");
    });
}

function removerMidiaMural(id) {
    if (confirm("Quer mesmo retirar esta lembrança do mural?")) {
        database.ref(`mural/${id}`).remove().then(() => {
            mostrarAviso("🗑️ Mídia removida do mural.");
        });
    }
}

// ANIVERSÁRIO
function verificarAniversario() {
    const hoje = new Date();
    if (hoje.getDate() === DATA_NAMORO.getDate() && hoje.getMonth() === DATA_NAMORO.getMonth()) {
        const banner = document.getElementById('anniversary-banner');
        if (banner) banner.style.display = 'block';
        setTimeout(() => {
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 500);
    }
}

// ROLETA
function rodarRoleta() {
    const display = document.getElementById('roulette-display');
    if (!display) return;
    
    display.classList.add('roulette-spinning');
    
    let voltas = 0;
    const intervalo = setInterval(() => {
        const aleatorio = opcoesRoleta[Math.floor(Math.random() * opcoesRoleta.length)];
        display.innerText = aleatorio;
        voltas++;
        
        if (voltas > 20) {
            clearInterval(intervalo);
            display.classList.remove('roulette-spinning');
            const escolhaFinal = opcoesRoleta[Math.floor(Math.random() * opcoesRoleta.length)];
            display.innerHTML = `✨ ${escolhaFinal} ✨`;
            mostrarAviso(`🎲 Destino escolhido!\n${escolhaFinal}`);
        }
    }, 100);
}

// Troca de Abas
function mudarTela(screenId, botaoAtivo) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const telaAlvo = document.getElementById(screenId);
    if(telaAlvo) telaAlvo.classList.add('active');
    if(botaoAtivo) botaoAtivo.classList.add('active');
}

// Contador
function atualizarContadorCompleto() {
    const elCounter = document.getElementById('counter');
    if (!elCounter) return;

    const agora = new Date();
    const dif = agora - DATA_NAMORO;
    const dias = Math.floor(dif / (1000 * 60 * 60 * 24));
    const horas = Math.floor((dif % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((dif % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((dif % (1000 * 60)) / 1000);
    elCounter.innerHTML = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
}

// Renderizar Missões
function renderizarMissoes() {
    const container = document.getElementById('lista-missoes');
    if (!container) return;
    
    container.innerHTML = '';
    missoes.forEach(missao => {
        const card = document.createElement('div');
        card.className = 'card-item';
        card.innerHTML = `
            <div class="card-text">
                <h4>${missao.titulo}</h4>
                <p>🎁 Ganhe +${missao.recompensa} moedas</p>
            </div>
            <button class="action-btn" ${missao.concluida ? 'disabled' : ''} onclick="completarMissao(${missao.id})">
                ${missao.concluida ? 'Concluído ✓' : 'Concluir'}
            </button>
        `;
        container.appendChild(card);
    });
}

function completarMissao(id) {
    const index = missoes.findIndex(m => m.id === id);
    if (index !== -1 && !missoes[index].concluida) {
        missoes[index].concluida = true;
        const novaRecompensa = missoes[index].recompensa;
        
        database.ref('missoes').set(missoes);
        database.ref('moedas').set(moedas + novaRecompensa).then(() => {
            mostrarAviso(`🪙 +${novaRecompensa} moedas adicionadas para o casal!`);
        });
    }
}

// Renderizar Loja de Cupons
function renderizarLoja() {
    const container = document.getElementById('lista-loja');
    if (!container) return;
    
    container.innerHTML = '';
    const itensLojaIniciais = [
        { id: 1, emoji: "🍿", titulo: "Vale Cinema", custo: 30 },
        { id: 2, emoji: "🍕", titulo: "Noite da Pizza", custo: 60 },
        { id: 3, emoji: "🍦", titulo: "Sorvetinho de Surpresa", custo: 20 },
        { id: 4, emoji: "💆‍♂️", titulo: "Massagem Premium", custo: 80 }
    ];
    itensLojaIniciais.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card-item shop-card';
        card.innerHTML = `
            <div class="emoji-badge" style="font-size:2rem;">${item.emoji}</div>
            <div class="card-text">
                <h4>${item.titulo}</h4>
                <p>Custo: ${item.custo} moedas</p>
            </div>
            <button class="action-btn" style="width: 100%; margin-top: 8px; background: var(--accent-purple); color: white; padding:6px; cursor:pointer;" onclick="comprarItem(${item.custo}, '${item.titulo}', '${item.emoji}')">
                Resgatar
            </button>
        `;
        container.appendChild(card);
    });
}

function comprarItem(custo, nome, emoji) {
    if (moedas >= custo) {
        database.ref('moedas').set(moedas - custo).then(() => {
            gerarFotoCupom(nome, emoji);
        });
    } else {
        mostrarAviso(`❌ Moedas insuficientes! Faltam ${custo - moedas} moedas.`);
    }
}

// Criador de Imagem do Cupom (Canvas)
function gerarFotoCupom(tituloPrêmio, emojiPrêmio) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;

    let gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 10]);
    ctx.strokeRect(20, 20, 560, 360);
    ctx.setLineDash([]); 

    ctx.fillStyle = '#ff3366';
    ctx.fillRect(20, 20, 8, 360);

    ctx.font = '130px Georgia';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillText(emojiPrêmio, 400, 260);

    ctx.fillStyle = '#9494a8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText("CUPOM EXCLUSIVO PREMIADO", 50, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(tituloPrêmio, 50, 130);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 180);
    ctx.lineTo(550, 180);
    ctx.stroke();

    ctx.fillStyle = '#9494a8';
    ctx.font = 'italic 18px Georgia';
    ctx.fillText("✓ Válido para resgate imediato com o seu amor.", 50, 230);

    const dataHoje = new Date().toLocaleDateString('pt-BR');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Emitido em: ${dataHoje}`, 50, 300);

    const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
    ctx.fillStyle = '#7f56da';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`SERIAL: LOVE-${numeroAleatorio}`, 50, 340);

    const imagemURL = canvas.toDataURL('image/png');
    document.getElementById('wrapper-imagem-cupom').innerHTML = `<img src="${imagemURL}" alt="Cupom" style="max-width:100%; height:auto;">`;
    const btnBaixar = document.getElementById('btn-baixar-cupom');
    if (btnBaixar) {
        btnBaixar.href = imagemURL;
        btnBaixar.download = `cupom-${tituloPrêmio.toLowerCase().replace(/\s+/g, '-')}.png`;
    }

    document.getElementById('modal-cupom').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal-cupom').style.display = 'none';
}

// ENCONTROS
function agendarEncontro() {
    const dataVal = document.getElementById('date-input').value;
    const horaVal = document.getElementById('time-input').value;
    const lugarVal = document.getElementById('place-input').value;
    const notasVal = document.getElementById('notes-input').value;
    const elPhone = document.getElementById('phone-input');
    
    let telefoneManual = elPhone ? elPhone.value.replace(/\D/g, '') : '';

    if (!dataVal || !horaVal || !lugarVal || !telefoneManual) {
        mostrarAviso("❌ Preencha data, hora, lugar e número de WhatsApp!");
        return;
    }

    if (telefoneManual.length <= 11) {
        telefoneManual = "55" + telefoneManual;
    }

    const partesData = dataVal.split('-');
    const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
    const notaFinal = notasVal || "Nenhuma nota extra adicionada.";

    const novoEncontro = {
        data: dataFormatada,
        hora: horaVal,
        lugar: lugarVal,
        notes: notaFinal
    };

    database.ref('encontro').set(novoEncontro).then(() => {
        const textoMensagem = `✨ *NOSSO PRÓXIMO ENCONTRO* ✨%0A%0A` +
                              `📅 *Data:* ${dataFormatada}%0A` +
                              `⏰ *Horário:* ${horaVal}%0A` +
                              `📍 *Local:* ${lugarVal}%0A` +
                              `✨ *Notas:* ${notaFinal}%0A%0A Te amo! ❤️`;
        
        window.open(`https://api.whatsapp.com/send?phone=${telefoneManual}&text=${textoMensagem}`, '_blank');
        
        document.getElementById('date-input').value = '';
        document.getElementById('time-input').value = '';
        document.getElementById('place-input').value = '';
        document.getElementById('notes-input').value = '';
        elPhone.value = '';
    });
}

function renderizarEncontro() {
    const container = document.getElementById('convite-encontro-container');
    if (!container) return;
    
    if (!encontroMarcado) {
        container.innerHTML = `
            <p style="color: var(--text-muted); font-size: 0.9rem; font-style: italic; text-align: center; padding: 20px;">
                Nenhum encontro marcado por enquanto. Use o formulário acima para sugerir um! 🌹
            </p>
        `;
        return;
    }

    container.innerHTML = `
        <div class="date-invitation-card" style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; max-width: 400px; margin: 0 auto;">
            <h4 style="color: var(--accent-pink); font-size: 1.1rem; margin-bottom: 12px; text-align:center;">💖 Convite Confirmado</h4>
            <p style="font-size: 0.95rem; margin-bottom: 6px;"><strong>📍 Local:</strong> ${encontroMarcado.lugar}</p>
            <p style="font-size: 0.95rem; margin-bottom: 6px;"><strong>📅 Data:</strong> ${encontroMarcado.data}</p>
            <p style="font-size: 0.95rem; margin-bottom: 12px;"><strong>⏰ Horário:</strong> ${encontroMarcado.hora}</p>
            <div style="background: rgba(0,0,0,0.03); padding: 10px; border-radius: 8px; border-left: 3px solid var(--accent-purple);">
                <p style="font-size: 0.85rem; color: #555;"><strong>✨ Notas:</strong> ${encontroMarcado.notes}</p>
            </div>
            <button class="action-btn" style="background: rgba(255, 51, 102, 0.15); color: var(--accent-pink); font-size: 0.8rem; margin-top: 15px; width: 100%; border: 1px solid rgba(255, 51, 102, 0.2); padding: 8px; cursor:pointer;" onclick="desmarcarEncontro()">
                ❌ Desmarcar ou Mudar Date
            </button>
        </div>
    `;
}

function desmarcarEncontro() {
    if(confirm("Deseja mesmo desmarcar ou alterar este encontro?")) {
        database.ref('encontro').remove().then(() => {
            mostrarAviso("🗑️ Encontro desmarcado.");
        });
    }
}

const mensagensSurpresa = [
    "💝 Você é o meu porto seguro. Te amo hoje mais do que ontem!",
    "🌹 Passando para lembrar que você tem o sorriso mais lindo desse mundo.",
    "🧸 Vale um abraço apertado de urso assim que a gente se vir!",
    "✨ Meu dia fica 100% melhor só de conversar com você."
];

function abrirSurpresa() {
    const fraseAleatoria = mensagensSurpresa[Math.floor(Math.random() * mensagensSurpresa.length)];
    mostrarAviso(fraseAleatoria);
}
