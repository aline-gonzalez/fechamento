import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para abrir a janela de gerenciamento de abrigos
export function abrirJanelaAbrigos() {
    const novaJanela = window.open("", "_blank", "width=600,height=800");
    novaJanela.document.write(`
        <html>
        <head>
            <title>Gerenciamento de Abrigos</title>
            <style>
    body { 
        font-family: Arial, sans-serif; 
        margin: 0; 
        padding: 20px; 
        max-width: 600px; 
        margin: 0 auto; /* Centraliza o conteúdo */
        text-align: center; /* Centraliza o texto */
    }
    .abrigo-item { margin-bottom: 10px; }
    .vaga-input { width: 60px !important; max-width: 60px !important; padding: 2px !important; box-sizing: border-box !important; margin-left: 10px; }
    button { margin-top: 10px; }
</style>

        </head>
        <body>
            <h1>Gerenciamento de Abrigos</h1>
            <form id="abrigoForm">
                <label for="acaoAbrigo">Ação:</label>
                <select id="acaoAbrigo">
                    <option value="Incluir">Incluir</option>
                    <option value="Excluir">Excluir</option>
                </select>
                <input type="text" id="nomeAbrigo" placeholder="Nome do Abrigo" required>
                <button type="submit">Enviar</button>
            </form>
            <div>
                <h2>Início</h2>
                <div id="abrigosInicio"></div>
            </div>
            <div>
                <h2>Fim</h2>
                <div id="abrigosFim"></div>
            </div>
            <button id="salvarValoresBtn">Salvar Valores de Início e Fim</button>
            <script>
                document.getElementById('abrigoForm').addEventListener('submit', async function(event) {
                    event.preventDefault();
                    const acao = document.getElementById('acaoAbrigo').value;
                    const nomeAbrigo = document.getElementById('nomeAbrigo').value.trim();
                    
                    if (nomeAbrigo) {
                        window.opener.postMessage({ acao, nomeAbrigo }, '*');
                        window.close(); 
                    } else {
                        alert("Por favor, insira o nome do abrigo.");
                    }
                });

                function atualizarAbrigos(abrigosInicioHtml, abrigosFimHtml) {
                    document.getElementById('abrigosInicio').innerHTML = abrigosInicioHtml;
                    document.getElementById('abrigosFim').innerHTML = abrigosFimHtml;
                }

                window.addEventListener('message', function(event) {
                    if (event.data.abrigosInicioHtml && event.data.abrigosFimHtml) {
                        atualizarAbrigos(event.data.abrigosInicioHtml, event.data.abrigosFimHtml);
                    }
                }, false);

                window.opener.postMessage({ solicitarAbrigos: true }, '*');

                // Função para salvar os valores de início e fim enviando para a janela principal
                document.getElementById('salvarValoresBtn').addEventListener('click', async function() {
                    const inputsInicio = document.querySelectorAll('#abrigosInicio .vaga-input');
                    const inputsFim = document.querySelectorAll('#abrigosFim .vaga-input');

                    const valores = [];

                    for (let i = 0; i < inputsInicio.length; i++) {
                        const id = inputsInicio[i].id.split('-')[1];
                        const vagasInicio = inputsInicio[i].value;
                        const vagasFim = inputsFim[i].value;

                        valores.push({
                            abrigoId: id,
                            vagasInicio: vagasInicio,
                            vagasFim: vagasFim
                        });
                    }

                    // Enviar os valores para a janela principal
                    window.opener.postMessage({ action: 'saveValoresAbrigos', valores }, '*');
                    alert("Valores de Início e Fim enviados para salvar!");
                });
            </script>
        </body>
        </html>
    `);
}

// Função para incluir ou excluir abrigos
export async function gerenciarAbrigo(acao, nomeAbrigo) {
    const abrigosRef = collection(db, "abrigos");

    if (acao === "Incluir") {
        await addDoc(abrigosRef, { nome: nomeAbrigo });
        alert("Abrigo incluído com sucesso!");
    } else if (acao === "Excluir") {
        const abrigosSnapshot = await getDocs(abrigosRef);
        const docToDelete = abrigosSnapshot.docs.find(doc => doc.data().nome === nomeAbrigo);
        if (docToDelete) {
            await deleteDoc(doc(db, "abrigos", docToDelete.id));
            alert("Abrigo excluído com sucesso!");
        } else {
            alert("Abrigo não encontrado.");
        }
    }

    const abrigosHtml = await carregarAbrigos(); 
    window.opener.postMessage(abrigosHtml, '*'); 
}

// Função para carregar e exibir abrigos
export async function carregarAbrigos() {
    const abrigosRef = collection(db, "abrigos");
    const abrigosSnapshot = await getDocs(abrigosRef);

    let abrigosInicioHtml = '';
    let abrigosFimHtml = '';

    abrigosSnapshot.forEach((doc) => {
        const nomeAbrigo = doc.data().nome;
        const vagasInicio = doc.data().vagasInicio || ''; 
        const vagasFim = doc.data().vagasFim || ''; 

        abrigosInicioHtml += `<div class="abrigo-item">
            <span>${nomeAbrigo}</span>
            <input type="number" class="vaga-input" id="inicio-${doc.id}" value="${vagasInicio}"
                style="width: 60px !important; max-width: 60px !important; padding: 2px !important; box-sizing: border-box !important; margin-left: 10px;">
        </div>`;
        
        abrigosFimHtml += `<div class="abrigo-item">
            <span>${nomeAbrigo}</span>
            <input type="number" class="vaga-input" id="fim-${doc.id}" value="${vagasFim}"
                style="width: 60px !important; max-width: 60px !important; padding: 2px !important; box-sizing: border-box !important; margin-left: 10px;">
        </div>`;
    });

    return { abrigosInicioHtml, abrigosFimHtml };
}

// Função para gerar o texto dos abrigos
export async function gerarTextoAbrigos() {
    const abrigosRef = collection(db, "abrigos");
    const abrigosSnapshot = await getDocs(abrigosRef);

    let textoAbrigos = '';
    let totalVagasDisponibilizadas = 0;
    let totalVagasUtilizadas = 0;
    let abrigosInicioHtml = '';
    let abrigosFimHtml = '';

    abrigosSnapshot.forEach((doc) => {
        const nomeAbrigo = doc.data().nome;
        const vagasInicio = parseInt(doc.data().vagasInicio) || 0;
        const vagasFim = parseInt(doc.data().vagasFim) || 0;

        totalVagasDisponibilizadas += vagasInicio;
        totalVagasUtilizadas += vagasFim;

        abrigosInicioHtml += `<span>${nomeAbrigo} - ${vagasInicio}</span><br>`;
        abrigosFimHtml += `<span>${nomeAbrigo} - ${vagasFim}</span><br>`;
    });

    textoAbrigos = `
        <hr>
        <strong>Total de vagas disponibilizadas:</strong> ${totalVagasDisponibilizadas}<br><br>
        ${abrigosInicioHtml}
        <hr>
        <strong>Total de vagas utilizadas:</strong> ${totalVagasUtilizadas}<br><br>
        ${abrigosFimHtml}
    `;

    return textoAbrigos;
}

// Adiciona o listener de mensagens para lidar com as mensagens da nova janela
window.addEventListener('message', async function(event) {
    if (event.data.solicitarAbrigos) {
        const abrigosHtml = await carregarAbrigos();
        event.source.postMessage(abrigosHtml, '*');
    } else if (event.data.acao && event.data.nomeAbrigo) {
        await gerenciarAbrigo(event.data.acao, event.data.nomeAbrigo);
        
        const abrigosHtml = await carregarAbrigos();
        window.opener.postMessage(abrigosHtml, '*');
    } else if (event.data.action === 'saveValoresAbrigos' && Array.isArray(event.data.valores)) {
        try {
            for (const valor of event.data.valores) {
                const { abrigoId, vagasInicio, vagasFim } = valor;
                await setDoc(doc(db, "valoresAbrigos", abrigoId), {
                    abrigoId,
                    vagasInicio: parseInt(vagasInicio) || 0,
                    vagasFim: parseInt(vagasFim) || 0
                });
                console.log(`Valores salvos para o abrigo ${abrigoId}: Início ${vagasInicio}, Fim ${vagasFim}`);
            }
            alert("Valores de Início e Fim salvos com sucesso!");
        } catch (error) {
            console.error('Erro ao salvar os valores:', error);
            alert("Erro ao salvar os valores. Verifique o console para mais informações.");
        }
    }
}, false);
