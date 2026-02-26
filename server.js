const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json());

// --- SUBSTITUA PELOS SEUS DADOS ---
const WHATSAPP_TOKEN = "SEU_TOKEN_DA_META";
const PHONE_NUMBER_ID = "SEU_PHONE_NUMBER_ID";
const ADMIN_NUMBER = "55SEUNUMEROAQUI";

// Simulação de banco de dados
const rifaNumeros = {};
for (let i = 1; i <= 50; i++) {
    rifaNumeros[i] = { status: "disponivel", dono: null };
}

app.get("/status-numeros", (req, res) => {
    res.json(rifaNumeros);
});

// Rota modificada para aceitar um array de números
app.post("/confirmar", async (req, res) => {
    // Agora esperamos 'numeros' (plural) como um array
    const { nome, telefone, numeros, transacao } = req.body;

    if (!nome || !telefone || !numeros || !transacao || !Array.isArray(numeros) || numeros.length === 0) {
        return res.status(400).json({ error: "Dados inválidos. É necessário selecionar pelo menos um número." });
    }

    // Verifica se TODOS os números selecionados estão disponíveis
    for (const numero of numeros) {
        if (!rifaNumeros[numero] || rifaNumeros[numero].status !== "disponivel") {
            return res.status(400).json({ error: `O número ${numero} não está mais disponível. Por favor, atualize a página e tente novamente.` });
        }
    }

    // Se todos estiverem disponíveis, marca todos como pagos
    numeros.forEach(numero => {
        rifaNumeros[numero] = { status: "pago", dono: nome };
    });

    // Formata a lista de números para a mensagem
    const numerosString = numeros.join(', ');

    const mensagemAdmin = `
📢 NOVA COMPRA DE RIFA (MÚLTIPLA)
---------------------------------
Nome: ${nome}
Telefone: ${telefone}
Números Escolhidos: ${numerosString}
Valor Total: R$ ${numeros.length * 10},00
Comprovante/Hash: ${transacao}
---------------------------------
Os números foram marcados como PAGOS.
`;

    try {
        await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            { messaging_product: "whatsapp", to: ADMIN_NUMBER, type: "text", text: { body: mensagemAdmin } },
            { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" } }
         );

        res.json({ status: "Pagamento confirmado e administrador notificado!" });

    } catch (error) {
        console.error("Erro no WhatsApp:", error.response ? error.response.data : error.message);
        // Reverte o status de todos os números em caso de erro no envio
        numeros.forEach(numero => {
            rifaNumeros[numero] = { status: "disponivel", dono: null };
        });
        res.status(500).json({ error: "Erro ao enviar notificação. A compra foi cancelada. Tente novamente." });
    }
});

// Use a porta fornecida pelo ambiente de hospedagem, ou 3000 como padrão
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API da rifa rodando na porta ${PORT}`));
