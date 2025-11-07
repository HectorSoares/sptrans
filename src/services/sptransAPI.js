import axios from "axios";

const API_BASE = "http://localhost:3000/api";
const token = import.meta.env.VITE_SPTRANS_TOKEN; // token vem do .env

// Cria instância do axios configurada
const api = axios.create({
  baseURL: API_BASE,
});

// Autentica na SPTrans (chamada única)
export async function autenticarSPTrans() {
  try {
    console.log("🔐 Autenticando na SPTrans...");
    await api.post(`/Login/Autenticar?token=${token}`);
    console.log("✅ Autenticação concluída!");
  } catch (err) {
    console.error("❌ Erro ao autenticar SPTrans:", err.message);
  }
}

// Busca linhas
export async function buscarLinhas(termo) {
  try {
    const resp = await api.get(`/Linha/Buscar?termosBusca=${termo}`);
    return resp.data;
  } catch (err) {
    console.error("❌ Erro ao buscar linhas:", err.message);
    return [];
  }
}

// Busca paradas de uma linha
export async function buscarParadasPorLinha(codigoLinha) {
  try {
    const resp = await api.get(
      `/Parada/BuscarParadasPorLinha?codigoLinha=${codigoLinha}`
    );
    return resp.data;
  } catch (err) {
    console.error("❌ Erro ao buscar paradas:", err.message);
    return [];
  }
}

// Busca posição dos ônibus de uma linha
export async function buscarPosicaoDosOnibus(codigoLinha) {
  try {
    const resp = await api.get(`/Posicao/Linha?codigoLinha=${codigoLinha}`);
    return resp.data?.vs || [];
  } catch (err) {
    console.error("❌ Erro ao buscar posição dos ônibus:", err.message);
    return [];
  }
}

// Busca previsão de chegada (opcional)
export async function buscarPrevisao(codigoParada, codigoLinha) {
  try {
    const resp = await api.get(
      `/Previsao?codigoParada=${codigoParada}&codigoLinha=${codigoLinha}`
    );
    return resp.data;
  } catch (err) {
    console.error("❌ Erro ao buscar previsão:", err.message);
    return null;
  }
}

export default api;
