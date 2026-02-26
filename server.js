const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors"); // Importa o pacote CORS
const app = express();

app.use(cors()); // Habilita o CORS para permitir a comunicação com o frontend
app.use(bodyParser.json());

// --- ATENÇÃO: Substitua pelos seus dados ---
const WHATSAPP_TOKEN = "SEU_TOKEN_DA_META"; // Token de acesso da API do WhatsApp
const PHONE_NUMBER_ID = "SEU_PHONE_NUMBER_ID"; // ID do número de telefone (remetente)
const ADMIN_NUMBER = "5511999999999"; // Número do administrador que receberá a notificação

// Simulação de um "banco de dados" para os números da rifa
// Em um projeto real, use um banco de dados como SQLite, PostgreSQL ou MongoDB.
const rifaNumeros = {};
for (let i = 1; i <= 50; i++) {
    rifaNumeros[i] = { status: "disponivel", dono: null }; // Status: disponivel, reservado, pago
}

// Rota para o frontend obter o status atual de todos os números
app.get("/status-numeros", (req, res) => {
    res.json(rifaNumeros);
});

// Rota para confirmar a compra de um número
app.post("/confirmar", async (req, res) => {
    const { nome, telefone, numero, transacao } = req.body;

    // Validação básica dos dados recebidos
    if (!nome || !telefone || !numero || !transacao) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    if (!rifaNumeros[numero] || rifaNumeros[numero].status !== "disponivel") {
        return res.status(400).json({ error: "Este número não está mais disponível." });
    }

    // Atualiza o status do número
    rifaNumeros[numero] = { status: "pago", dono: nome };

    // Mensagem para o administrador
    const mensagemAdmin = `
📢 NOVA COMPRA DE RIFA CONFIRMADA
---------------------------------
Nome: ${nome}
Telefone: ${telefone}
Número Escolhido: ${numero}
Comprovante/Hash: ${transacao}
---------------------------------
O número ${numero} foi marcado como PAGO.
`;

    try {
        // Envia a notificação para o administrador via WhatsApp
        await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: ADMIN_NUMBER,
                type: "text",
                text: { body: mensagemAdmin },
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
         );

        // Responde ao frontend com sucesso
        res.json({ status: "Pagamento confirmado e administrador notificado com sucesso!" });

    } catch (error) {
        console.error("Erro detalhado:", error.response ? error.response.data : error.message);
        // Mesmo com erro no WhatsApp, o número foi salvo. Informa o erro.
        rifaNumeros[numero] = { status: "disponivel", dono: null }; // Reverte o status em caso de erro
        res.status(500).json({ error: "Erro ao enviar notificação para o administrador. Tente novamente." });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API da rifa rodando na porta ${PORT}`));
