import { useState, useEffect, useRef } from "react";
import axios from "axios";
import MapView from "./components/MapView";

const API_BASE = "http://localhost:3000/api";

function App() {
  const [termo, setTermo] = useState("");
  const [linhas, setLinhas] = useState([]);
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [paradas, setParadas] = useState([]);
  const [onibus, setOnibus] = useState([]);
  const intervalRef = useRef(null); // para guardar o intervalo de atualização

  const token = import.meta.env.VITE_SPTRANS_TOKEN; // coloque seu token no .env

  // Autentica apenas uma vez no carregamento do app
  useEffect(() => {
    const autenticar = async () => {
      try {
        console.log("🔐 Autenticando na SPTrans...");
        await axios.post(`${API_BASE}/Login/Autenticar?token=${token}`);
        console.log("✅ Autenticação concluída!");
      } catch (err) {
        console.error("❌ Erro ao autenticar:", err.message);
      }
    };
    autenticar();
  }, [token]);

  const buscarLinhas = async () => {
    try {
      const resp = await axios.get(
        `${API_BASE}/Linha/Buscar?termosBusca=${termo}`
      );
      setLinhas(resp.data);
    } catch (err) {
      console.error("Erro ao buscar linhas:", err.message);
    }
  };

  const buscarParadasELocalizacao = async (linha) => {
    try {
      console.log(`📍 Carregando paradas da linha ${linha.lt}...`);
      const paradasResp = await axios.get(
        `${API_BASE}/Parada/BuscarParadasPorLinha?codigoLinha=${linha.cl}`
      );
      setParadas(paradasResp.data);

      const atualizarOnibus = async () => {
        try {
          const posResp = await axios.get(
            `${API_BASE}/Posicao/Linha?codigoLinha=${linha.cl}`
          );
          const veiculos = posResp.data?.vs || [];
          setOnibus(veiculos);
          console.log(`🚌 Atualizado: ${veiculos.length} veículos`);
        } catch (err) {
          console.error("Erro ao buscar posição dos ônibus:", err.message);
        }
      };

      // Busca inicial
      await atualizarOnibus();

      // Cancela atualizações anteriores
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Atualiza a cada 15s
      intervalRef.current = setInterval(atualizarOnibus, 5000);
    } catch (err) {
      console.error("Erro ao buscar paradas:", err.message);
    }
  };

  // Limpa o intervalo ao desmontar o componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🚌 Mapa SPTrans</h1>

      <div>
        <input
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Digite o número ou nome da linha..."
          style={{ padding: "0.5rem", width: "300px" }}
        />
        <button onClick={buscarLinhas} style={{ marginLeft: "1rem" }}>
          Buscar
        </button>
      </div>

      {linhas.length > 0 && (
        <select
          onChange={(e) =>
            setLinhaSelecionada(
              linhas.find((l) => l.cl === Number(e.target.value))
            )
          }
          style={{ marginTop: "1rem", padding: "0.5rem" }}
        >
          <option value="">Selecione uma linha...</option>
          {linhas.map((l) => (
            <option key={l.cl} value={l.cl}>
              {l.lt} - {l.tp} ⇄ {l.ts}
            </option>
          ))}
        </select>
      )}

      {linhaSelecionada && (
        <button
          onClick={() => buscarParadasELocalizacao(linhaSelecionada)}
          style={{ marginLeft: "1rem" }}
        >
          Mostrar no mapa
        </button>
      )}

      <div style={{ marginTop: "2rem" }}>
        <MapView
          paradas={paradas}
          onibus={onibus}
          codigoLinha={linhaSelecionada?.cl || null}
        />
      </div>
    </div>
  );
}

export default App;
