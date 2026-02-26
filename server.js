const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const WHATSAPP_TOKEN = "SEU_TOKEN_META";
const PHONE_NUMBER_ID = "SEU_PHONE_NUMBER_ID";
const ADMIN_NUMBER = "55SEUNUMEROAQUI"; // ex: 5511999999999

app.post("/confirmar", async (req, res) => {
    const { nome, telefone, numero, transacao } = req.body;

    const mensagem = `
📢 NOVA CONFIRMAÇÃO DE RIFA

Nome: ${nome}
Telefone: ${telefone}
Número escolhido: ${numero}
Comprovante/Hash: ${transacao}
`;

    try {
        await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: ADMIN_NUMBER,
                type: "text",
                text: { body: mensagem }
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({ status: "Mensagem enviada com sucesso" });

    } catch (error) {
        res.status(500).json({ error: "Erro ao enviar mensagem" });
    }
});

app.listen(3000, () => console.log("API rodando na porta 3000"));
