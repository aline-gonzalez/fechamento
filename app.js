import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { abrirJanelaAbrigos } from './abrigos.js'; // Importação única

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDkqzz4CysFFcWh2SnYCRiYg0yM3V6ePQ0",
    authDomain: "fechamento-de-plantao-9c4b0.firebaseapp.com",
    projectId: "fechamento-de-plantao-9c4b0",
    storageBucket: "fechamento-de-plantao-9c4b0.appspot.com",
    messagingSenderId: "926334242810",
    appId: "1:926334242810:web:a90df0b4701a08f6e35e43",
    measurementId: "G-96LE9E6H3Z"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; // Exporta o db para ser utilizado em outros módulos como abrigos.js

// Evento para o botão "Abrigos" para abrir a janela correspondente
document.getElementById('abrigoBtn').addEventListener('click', function(event) {
    abrirJanelaAbrigos();
});

// Função para abrir a janela de edição de cargos
document.getElementById('editarCargosBtn').addEventListener('click', function() {
    const novaJanela = window.open('edit_cargos.html', '_blank', 'width=600,height=400');
    if (novaJanela) {
        novaJanela.focus();
    } else {
        alert('Por favor, habilite pop-ups no seu navegador para acessar esta função.');
    }
});

// Mostrar/ocultar campos baseados no turno selecionado
document.getElementById('turnoManhaCheckbox').addEventListener('change', function() {
    const isChecked = this.checked;
    document.getElementById('turnoManhaCampos').style.display = isChecked ? 'block' : 'none';
});

document.getElementById('turnoTardeCheckbox').addEventListener('change', function() {
    const isChecked = this.checked;
    document.getElementById('turnoTardeCampos').style.display = isChecked ? 'block' : 'none';
});

// Mostrar/ocultar campos baseados na seleção de "Outros órgãos"
document.getElementById('outrosOrgaosCheckbox').addEventListener('change', function() {
    const isChecked = this.checked;
    document.getElementById('outrosOrgaosCampos').style.display = isChecked ? 'block' : 'none';
});

// Função para enviar dados do formulário ao Firestore
document.getElementById('reportForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const data = document.getElementById('data').value;
    const acao = document.getElementById('acao').value;
    const tecnico = document.getElementById('tecnico').value || '';
    const conselhoTutelar = document.getElementById('conselhoTutelar').value;

    const relatorio = {
        data: data,
        acao: acao,
        tecnico: tecnico,
        conselhoTutelar: conselhoTutelar,
        outrosOrgaos: {}
    };

    // Verifica se o campo de "Outros Órgãos" está marcado e coleta seus valores
    if (document.getElementById('outrosOrgaosCheckbox').checked) {
        const outrosOrgaosTurno = document.getElementById('periodoOutrosOrgaos').value || '';
        const outrosOrgaosObservacoes = document.getElementById('observacoesOutrosOrgaos').value || '';

        relatorio.outrosOrgaos = {
            turno: outrosOrgaosTurno,
            observacoes: outrosOrgaosObservacoes
        };
    }

    if (document.getElementById('turnoManhaCheckbox').checked) {
        relatorio.turnoManha = {
            educadores: parseInt(document.getElementById('educadoresManha').value, 10) || 0,
            tablet: document.getElementById('tabletManha').value || '',
            acolhimento: document.getElementById('acolhimentoManha').value || '',
            encaminhamento: document.getElementById('encaminhamentoManha').value || '',
        };
    }

    if (document.getElementById('turnoTardeCheckbox').checked) {
        relatorio.turnoTarde = {
            tablet: document.getElementById('tabletTarde').value || '',
            acolhimento: document.getElementById('acolhimentoTarde').value || '',
            encaminhamento: document.getElementById('encaminhamentoTarde').value || '',
        };
    }

    try {
        await addDoc(collection(db, "relatorios"), relatorio);
        alert("Informações enviadas com sucesso!");

        // Reseta os campos do formulário após o envio
        document.getElementById('reportForm').reset();

        // Esconde os campos de turno e outros órgãos novamente após o reset
        document.getElementById('turnoManhaCampos').style.display = 'none';
        document.getElementById('turnoTardeCampos').style.display = 'none';
        document.getElementById('outrosOrgaosCampos').style.display = 'none';

    } catch (error) {
        console.error("Erro ao enviar dados: ", error);
    }
});


// Função para buscar relatórios de uma data específica e abrir uma nova janela
document.getElementById('buscarRelatoriosBtn').addEventListener('click', function() {
    console.log("Botão Fechamento clicado.");
    const dataRelatorio = document.getElementById('dataRelatorio').value;
    if (dataRelatorio) {
        buscarRelatoriosPorData(dataRelatorio);
    } else {
        alert("Por favor, selecione uma data para buscar os relatórios.");
    }
});

// Função para carregar os cargos do Firestore
async function carregarCargos() {
    const cargosRef = doc(db, "config", "cargos");
    const cargosDoc = await getDoc(cargosRef);

    if (cargosDoc.exists()) {
        return cargosDoc.data();
    } else {
        return {};
    }
}

// Função para buscar relatórios e incluir os cargos no relatório
async function buscarRelatoriosPorData(data) {
    const relatoriosRef = collection(db, "relatorios");
    const q = query(relatoriosRef, where("data", "==", data));
    const querySnapshot = await getDocs(q);

    // Carrega os cargos do Firestore
    const cargos = await carregarCargos();

    let totalEducadores = 0;
    let tecnicos = [];
    let relatorios = '';
    let conselhoTutelar = null;

    querySnapshot.forEach((doc) => {
        const dados = doc.data();

        // Coleta os técnicos e soma os educadores
        if (dados.tecnico) {
            tecnicos.push(dados.tecnico);
        }

        if (dados.turnoManha && dados.turnoManha.educadores) {
            totalEducadores += parseInt(dados.turnoManha.educadores, 10);
        }

        relatorios += `<strong>ID:</strong> ${doc.id}<br>`;
        relatorios += `<strong>Ação:</strong> ${dados.acao}<br>`;

        if (dados.tecnico) {
            relatorios += `<strong>Técnico:</strong> ${dados.tecnico}<br>`;
        }

        if (dados.turnoManha) {
            relatorios += `<strong>Quantidade de Educadores:</strong> ${dados.turnoManha.educadores || 0}<br>`;
            relatorios += `<strong>Turno da Manhã:</strong><br>`;
            relatorios += `<strong>Lançamento tablet:</strong> ${dados.turnoManha.tablet || ''}<br>`;
            relatorios += `<strong>Acolhimento:</strong> ${dados.turnoManha.acolhimento || ''}<br>`;
            relatorios += `<strong>Encaminhamento:</strong> ${dados.turnoManha.encaminhamento || ''}<br>`;
            relatorios += `<br>`; // Pequeno espaço entre as seções do turno
        }

        if (dados.turnoTarde) {
            relatorios += `<strong>Turno da Tarde:</strong><br>`;
            relatorios += `<strong>Lançamento tablet:</strong> ${dados.turnoTarde.tablet || ''}<br>`;
            relatorios += `<strong>Acolhimento:</strong> ${dados.turnoTarde.acolhimento || ''}<br>`;
            relatorios += `<strong>Encaminhamento:</strong> ${dados.turnoTarde.encaminhamento || ''}<br>`;
            relatorios += `<br>`; // Pequeno espaço antes de começar o próximo relatório
        }

        // Captura o valor do conselho tutelar para ser mostrado ao final
        conselhoTutelar = dados.conselhoTutelar;

        relatorios += `<hr>`; // Linha horizontal para separar os relatórios
    });

    // Seção 1: Coordenador Geral e Cargos
    let cargosHtml = `
     <strong>1. Coordenador Geral:</strong> ${cargos.coordenadorGeral || ''}<br>
     <strong>1.1 Assessoria Técnica:</strong> ${cargos.assessoriaTecnica || ''}<br>
     <strong>1.2 Gerência de Abordagem:</strong> ${cargos.gerenciaAbordagem || ''}<br>
     <strong>1.3 Gerência NAAS:</strong> ${cargos.gerenciaNAAS || ''}<br>
     <strong>1.4 Gerência de Monitoramento:</strong> ${cargos.gerenciaMonitoramento || ''}<br><br>
     `;

    // Seção 2: Plantão Diurno PD1 - Téc
    let tecnicosHtml = `<strong>2. Plantão Diurno PD1 - Téc:</strong> ${tecnicos.join(', ')}<br><br>`;

    // Seção 3: Quantitativo de Efetivo
    let quantitativoHtml = `
    <strong>3. Quantitativo de Efetivo:</strong><br>
    - Educadores: ${totalEducadores}<br>
    - Téc. Suas: ${tecnicos.length}<br><br>
    `;

    // Seção 4: Atividades Desenvolvidas
    let atividadesHtml = `<strong>4. Atividades desenvolvidas:</strong><br><br>`;

    // Adiciona a linha "Houve Ação Conjunta com o Conselho Tutelar" ao final
    let conselhoTutelarHtml = `<strong>Houve Ação Conjunta com o Conselho Tutelar:</strong> ${conselhoTutelar || 'Não informado'}<br><br>`;

    // Obtém o texto dos abrigos e valores
    const textoAbrigos = await gerarTextoAbrigos();   

    // Corrigir a data para o fuso horário correto
    const dataObj = new Date(data + "T00:00:00");
    const dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Abrir uma nova janela para exibir os resultados
    const novaJanela = window.open("", "_blank", "width=600,height=800");
    novaJanela.document.write(`
        <html>
        <head>
            <title>Relatório Consolidado de Abordagem Especializada</title>
        </head>
        <body>
            <h1>Relatório Consolidado de Abordagem Especializada</h1>
            <h2>Data: ${dataFormatada}</h2>
            <span>${cargosHtml}${tecnicosHtml}${quantitativoHtml}${atividadesHtml}${relatorios}${conselhoTutelarHtml}${textoAbrigos}</span>
        </body>
        </html>
    `);
}

// Função para gerar o texto dos abrigos e outros dados no fechamento
export async function gerarTextoAbrigos() {
    const abrigosRef = collection(db, "abrigos");
    const valoresRef = collection(db, "valoresAbrigos");
    const relatoriosRef = collection(db, "relatorios");
    const abrigosSnapshot = await getDocs(abrigosRef);
    const valoresSnapshot = await getDocs(valoresRef);
    const relatoriosSnapshot = await getDocs(relatoriosRef);

    let textoAbrigos = '';
    let totalVagasDisponibilizadas = 0;
    let totalVagasUtilizadas = 0;
    let totalGeralTablet = 0;
    let abrigosInicioHtml = '';
    let abrigosFimHtml = '';
    let outrosOrgaosTexto = ''; // Variável única para montar a seção dos órgãos presentes

    const valoresMap = {};

    // Mapeia os valores de início e fim dos abrigos
    valoresSnapshot.forEach((doc) => {
        valoresMap[doc.id] = doc.data();
    });

    // Processa os abrigos e calcula os totais
    abrigosSnapshot.forEach((doc) => {
        const nomeAbrigo = doc.data().nome;
        const vagasInicio = parseInt(valoresMap[doc.id]?.vagasInicio) || 0;
        const vagasFim = parseInt(valoresMap[doc.id]?.vagasFim) || 0;

        totalVagasDisponibilizadas += vagasInicio;
        totalVagasUtilizadas += (vagasInicio - vagasFim); // Calcula as vagas utilizadas

        abrigosInicioHtml += `<span>${nomeAbrigo} - ${vagasInicio}</span><br>`;
        abrigosFimHtml += `<span>${nomeAbrigo} - ${vagasFim}</span><br>`;
    });

    // Calcula o total geral de atendimentos incluídos no tablet
    relatoriosSnapshot.forEach((doc) => {
        const dados = doc.data();
        if (dados.turnoManha && dados.turnoManha.tablet) {
            totalGeralTablet += parseInt(dados.turnoManha.tablet) || 0;
        }
        if (dados.turnoTarde && dados.turnoTarde.tablet) {
            totalGeralTablet += parseInt(dados.turnoTarde.tablet) || 0;
        }

        // Processa os "Outros órgãos" para exibição e monta uma vez
        if (dados.outrosOrgaos && !outrosOrgaosTexto.includes(dados.acao)) {
            outrosOrgaosTexto += `<strong>${dados.acao}:</strong><br>`;
            outrosOrgaosTexto += `${dados.outrosOrgaos.turno}<br>`;
            outrosOrgaosTexto += `${dados.outrosOrgaos.observacoes}<br><br>`;
        }
    });

    // Adiciona a observação do Técnico SUAS
    const observacaoTecnico = document.getElementById('observacoesTecnico').value || '';

    // Adiciona o total de demandas emergenciais e total de ouvidorias
    const totalDemandasEmergenciais = document.getElementById('demandasEmergenciais').value || '0';
    const totalOuvidorias = document.getElementById('totalOuvidorias').value || '0';

    // Texto final para exibir os dados de abrigos e outros órgãos
    textoAbrigos = `
        <hr>
        <strong>Total de vagas disponibilizadas:</strong> ${totalVagasDisponibilizadas}<br><br>
        ${abrigosInicioHtml}
        <hr>
        <strong>Total de vagas utilizadas:</strong> ${totalVagasUtilizadas}<br><br>
        ${abrigosFimHtml}
        <hr>
        <strong>Total Geral de Atendimentos Incluídos no Tablet:</strong> <strong>${totalGeralTablet}</strong><br><br>
        <hr>
        <strong>Observações do Técnico SUAS:</strong><br>
        <span style="display: block; max-width: 300px; word-wrap: break-word;">${observacaoTecnico}</span>
        <hr>
        <strong>Órgãos Presentes nas ações:</strong><br><br>
        ${outrosOrgaosTexto} <!-- Renderiza aqui apenas uma vez -->
        <hr>
        <strong>Total de demandas emergenciais:</strong> ${totalDemandasEmergenciais}<br><br>
        <strong>Total de ouvidorias:</strong> ${totalOuvidorias}<br><br>
    `;

    return textoAbrigos;
}
