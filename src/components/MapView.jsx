import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useState } from "react";
import busIcon from "../assets/bus3.svg";
import busStopIcon from "../assets/bus-stop.svg";

// Ícones customizados
const iconeOnibus = new L.Icon({
  iconUrl: busIcon,
  iconSize: [30, 30],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const iconeParada = new L.Icon({
  iconUrl: busStopIcon,
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

export default function MapView({ paradas = [], onibus = [], codigoLinha }) {
  const [previsoes, setPrevisoes] = useState({});
  const center = [-23.55052, -46.633308]; // centro de SP

  async function handleClickParada(parada) {
    try {
      const res = await fetch(
        `http://localhost:3000/api/Previsao?codigoParada=${parada.cp}&codigoLinha=${codigoLinha}`
      );
      if (!res.ok) throw new Error("Erro na resposta do servidor");
      const data = await res.json();
      console.log("Previsão recebida:", data);

      // 🔹 Extrai previsões da estrutura correta
      const linhas = data?.p?.l || [];
      const veiculos = linhas.flatMap((l) =>
        (l.vs || []).map((v) => ({
          placa: v.p,
          horario: v.t,
          linha: l.c,
        }))
      );

      setPrevisoes((prev) => ({
        ...prev,
        [parada.cp]: veiculos,
      }));
    } catch (err) {
      console.error("Erro ao buscar previsão:", err);
      setPrevisoes((prev) => ({
        ...prev,
        [parada.cp]: [],
      }));
    }
  }

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Paradas (azul) */}
      {paradas.map((p) => (
        <Marker
          key={p.cp}
          position={[p.py, p.px]}
          icon={iconeParada}
          eventHandlers={{
            click: () => handleClickParada(p),
          }}
        >
          <Popup>
            <b>{p.np}</b>
            <br />
            Código: {p.cp}
            <hr />
            {previsoes[p.cp] ? (
              previsoes[p.cp].length > 0 ? (
                previsoes[p.cp].map((v, i) => (
                  <div key={i}>
                    Previsão: <br /> 🚌 <b>{v.linha}</b> — {v.horario}
                  </div>
                ))
              ) : (
                <span>Sem previsão disponível</span>
              )
            ) : (
              <span>Clique para carregar previsões...</span>
            )}
          </Popup>
        </Marker>
      ))}

      {/* Ônibus (vermelho) */}
      {onibus.map((v) => (
        <Marker key={v.p} position={[v.py, v.px]} icon={iconeOnibus}>
          <Popup>
            🚌 Ônibus {v.p}
            <br />
            Atualizado: {new Date(v.ta).toLocaleTimeString()}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
