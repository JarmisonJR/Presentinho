// CONFIGURAÇÃO DO NAMORO (Configure seu ano, mês-1, dia, hora)
const DATA_NAMORO = new Date(2024, 5, 12, 20, 0, 0); 

// Banco de Dados Inicial
const missoesIniciais = [
    { id: 1, titulo: "Mensagem de bom dia fofa", recompensa: 10, concluida: false },
    { id: 2, titulo: "Me mandar uma foto do seu sorriso hoje", recompensa: 15, concluida: false },
    { id: 3, titulo: "Preparar ou escolher o lanche do date", recompensa: 25, concluida: false },
    { id: 4, titulo: "Massagem de 15 minutos sem reclamar", recompensa: 30, concluida: false }
];

const itensLojaIniciais = [
    { id: 1, emoji: "🍿", titulo: "Vale Cinema", custo: 30 },
    { id: 2, emoji: "🍕", titulo: "Noite da Pizza", custo: 60 },
    { id: 3, emoji: "🍦", titulo: "Sorvetinho no Meio da Semana", custo: 20 },
    { id: 4, emoji: "💆‍♂️", titulo: "Massagem Premium", custo: 80 }
];

// Carregar LocalStorage
let moedas = parseInt(localStorage.getItem('moedas')) || 0;
let missoes = JSON.parse(localStorage.getItem('missoes')) || missoesIniciais;
let encontroMarcado = JSON.parse(localStorage.getItem('encontroMarcado')) || null;

document.addEventListener("DOMContentLoaded", () => {
    atualizarInterfaceMoedas();
    renderizarMissoes();
    renderizarLoja();
    renderizarEncontro(); // Carrega o encontro salvo ao iniciar
    setInterval(atualizarContadorCompleto, 1000);
    atualizarContadorCompleto();
});

// Navegação entre abas
function mudarTela(screenId, botaoAtivo) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    botaoAtivo.classList.add('active');
}

// Contador
function atualizarContadorCompleto() {
    const agora = new Date();
    const dif = agora - DATA_NAMORO;
    const dias = Math.floor(dif / (1000 * 60 * 60 * 24));
    const horas = Math.floor((dif % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((dif % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((dif % (1000 * 60)) / 1000);
    document.getElementById('counter').innerHTML = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
}

// Notificação flutuante
function mostrarAviso(texto) {
    const toast = document.getElementById('custom-toast');
    toast.innerText = texto;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.style.display = 'none', 300);
    }, 3500);
}

function atualizarInterfaceMoedas() {
    document.getElementById('moedas-count').innerText = moedas;
    localStorage.setItem('moedas', moedas);
}

// Renderizar Missões
function renderizarMissoes() {
    const container = document.getElementById('lista-missoes');
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
    const missao = missoes.find(m => m.id === id);
    if (missao && !missao.concluida) {
        missao.concluida = true;
        moedas += missao.recompensa;
        localStorage.setItem('missoes', JSON.stringify(missoes));
        atualizarInterfaceMoedas();
        renderizarMissoes();
        mostrarAviso(`🪙 +${missao.recompensa} moedas adicionadas!`);
    }
}

// Renderizar Loja
function renderizarLoja() {
    const container = document.getElementById('lista-loja');
    container.innerHTML = '';
    itensLojaIniciais.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card-item shop-card';
        card.innerHTML = `
            <div class="emoji-badge">${item.emoji}</div>
            <div class="card-text">
                <h4>${item.titulo}</h4>
                <p>Custo: ${item.custo} moedas</p>
            </div>
            <button class="action-btn" style="width: 100%; margin-top: 8px; background: var(--accent-purple); color: white;" onclick="comprarItem(${item.custo}, '${item.titulo}', '${item.emoji}')">
                Resgatar
            </button>
        `;
        container.appendChild(card);
    });
}

function comprarItem(custo, nome, emoji) {
    if (moedas >= custo) {
        moedas -= custo;
        atualizarInterfaceMoedas();
        gerarFotoCupom(nome, emoji);
    } else {
        mostrarAviso(`❌ Moedas insuficientes! Faltam ${custo - moedas} moedas.`);
    }
}

// Desenhar Cupom em Imagem
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
    document.getElementById('wrapper-imagem-cupom').innerHTML = `<img src="${imagemURL}" alt="Cupom">`;
    const btnBaixar = document.getElementById('btn-baixar-cupom');
    btnBaixar.href = imagemURL;
    btnBaixar.download = `cupom-${tituloPrêmio.toLowerCase().replace(/\s+/g, '-')}.png`;

    document.getElementById('modal-cupom').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal-cupom').style.display = 'none';
}

// SISTEMA DE AGENDAMENTO DE ENCONTROS (Mecânica Nova)
function agendarEncontro() {
    const dataVal = document.getElementById('date-input').value;
    const horaVal = document.getElementById('time-input').value;
    const lugarVal = document.getElementById('place-input').value;
    const notasVal = document.getElementById('notes-input').value;

    // Validação simples
    if (!dataVal || !horaVal || !lugarVal) {
        mostrarAviso("❌ Por favor, preencha data, hora e lugar!");
        return;
    }

    // Formatar data de AAAA-MM-DD para DD/MM/AAAA
    const partesData = dataVal.split('-');
    const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

    // Objeto do encontro
    encontroMarcado = {
        data: dataFormatada,
        hora: horaVal,
        lugar: lugarVal,
        notas: notasVal || "Nenhuma nota extra adicionada."
    };

    // Salvar na memória
    localStorage.setItem('encontroMarcado', JSON.stringify(encontroMarcado));
    
    // Atualizar a interface
    renderizarEncontro();
    mostrarAviso("💌 Encontro salvo e convite gerado!");

    // Limpar campos do formulário
    document.getElementById('date-input').value = '';
    document.getElementById('time-input').value = '';
    document.getElementById('place-input').value = '';
    document.getElementById('notes-input').value = '';
}

function renderizarEncontro() {
    const container = document.getElementById('convite-encontro-container');
    
    if (!encontroMarcado) {
        container.innerHTML = `
            <p style="color: var(--text-muted); font-size: 0.9rem; font-style: italic; text-align: center; padding: 20px;">
                Nenhum encontro marcado por enquanto. Use o formulário acima para sugerir um! 🌹
            </p>
        `;
        return;
    }

    // Se houver um encontro ativo, cria o convite estilizado
    container.innerHTML = `
        <div class="date-invitation-card">
            <h4 style="color: var(--accent-pink); font-size: 1.1rem; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                💖 Convite Confirmado
            </h4>
            <p style="font-size: 0.95rem; margin-bottom: 6px;"><strong>📍 Local:</strong> ${encontroMarcado.lugar}</p>
            <p style="font-size: 0.95rem; margin-bottom: 6px;"><strong>📅 Data:</strong> ${encontroMarcado.data}</p>
            <p style="font-size: 0.95rem; margin-bottom: 12px;"><strong>⏰ Horário:</strong> ${encontroMarcado.hora}</p>
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; border-left: 3px solid var(--accent-purple);">
                <p style="font-size: 0.85rem; color: var(--text-muted);"><strong>✨ Notas:</strong> ${encontroMarcado.notas}</p>
            </div>
            <button class="action-btn" style="background: rgba(255, 51, 102, 0.15); color: var(--accent-pink); font-size: 0.8rem; margin-top: 15px; width: 100%; border: 1px solid rgba(255, 51, 102, 0.2);" onclick="desmarcarEncontro()">
                ❌ Desmarcar / Mudar Date
            </button>
        </div>
    `;
}

function desmarcarEncontro() {
    if(confirm("Deseja mesmo desmarcar ou alterar este encontro?")) {
        encontroMarcado = null;
        localStorage.removeItem('encontroMarcado');
        renderizarEncontro();
        mostrarAviso("🗑️ Encontro desmarcado.");
    }
}

// Sistema de teste
function resetarMissoesParaTeste() {
    missoes = missoes.map(m => ({ ...m, concluida: false }));
    localStorage.setItem('missoes', JSON.stringify(missoes));
    renderizarMissoes();
    mostrarAviso("🔄 Missões resetadas com sucesso!");
}

// Cápsula do Dia
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
