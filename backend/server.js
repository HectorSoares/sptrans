import express from "express";
import axios from "axios";
import cors from "cors";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

const app = express();
app.use(cors());

const API_BASE = "http://api.olhovivo.sptrans.com.br/v2.1";
const TOKEN =
  "3af3ccede3d33820e692dc49bd18ffc855e0d8a7ea06fef3f1476d9c4b6fc89b";

// 🔹 cria jar para armazenar cookies da SPTrans
const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

let autenticado = false;

async function autenticar() {
  if (!autenticado) {
    console.log("🔐 Autenticando na SPTrans...");
    await client.post(`${API_BASE}/Login/Autenticar?token=${TOKEN}`);
    autenticado = true;
    console.log("✅ Autenticação concluída!");
  }
}

// 🔹 rota para autenticação manual (opcional)
app.post("/api/Login/Autenticar", async (req, res) => {
  try {
    await autenticar();
    res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro na autenticação:", err.message);
    res.status(500).json({ error: "Falha ao autenticar na SPTrans" });
  }
});

// 🔹 rota proxy genérica
app.get(/^\/api\/(.*)/, async (req, res) => {
  try {
    await autenticar(); // garante que está autenticado
    const subpath = req.params[0];
    const url = `${API_BASE}/${subpath}?${new URLSearchParams(req.query)}`;
    const response = await client.get(url); // usa o mesmo client com cookies
    res.json(response.data);
  } catch (err) {
    console.error("Erro na requisição:", err.message);
    res.status(500).json({ error: "Erro ao consultar SPTrans" });
  }
});

// 🔹 rota dedicada de previsão
app.get("/api/Previsao", async (req, res) => {
  const { codigoParada, codigoLinha } = req.query;

  if (!codigoParada || !codigoLinha) {
    return res.status(400).json({
      error: "Parâmetros codigoParada e codigoLinha são obrigatórios.",
    });
  }

  try {
    await autenticar();

    const url = `${API_BASE}/Previsao?codigoParada=${codigoParada}&codigoLinha=${codigoLinha}`;
    const { data } = await client.get(url);

    // Normaliza formato
    const linhasArray =
      data?.p?.l ?? data?.l ?? (Array.isArray(data) ? data : []);
    const now = Date.now();

    // Converte para formato simplificado e já calcula minutos restantes
    const resultado = linhasArray.map((l) => {
      const descricao = l.lt0 ? `${l.lt0} ⇄ ${l.lt1}` : l.c || l.cl || "Linha";
      const veiculos = (l.vs || []).map((v) => {
        const ts = Date.parse(v.ta);
        const minutos = isNaN(ts) ? null : Math.round((ts - now) / 60000);
        return {
          placa: v.p,
          horaPrevista: v.t || null,
          minutos,
          ativo: v.a,
          py: v.py,
          px: v.px,
        };
      });
      return {
        codigoLinha: l.cl ?? l.c,
        descricao,
        veiculos,
      };
    });

    res.json({
      parada: {
        codigoParada,
        nome: data?.p?.np ?? null,
      },
      linhas: resultado,
      atualizado: data?.hr ?? new Date().toISOString(),
    });
  } catch (err) {
    console.error("Erro ao buscar previsão:", err.message);
    res
      .status(500)
      .json({ error: "Falha ao obter previsão", detalhe: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 Proxy rodando em http://localhost:${PORT}`)
);
