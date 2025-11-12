// backend/src/models/stats.js

import { DataTypes } from "sequelize";

const StatModel = (sequelize) => {
  const Stat = sequelize.define(
    "stats",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // --- CAMPOS HISTÓRICOS (YA EXISTEN) ---
      gamesplayed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      gameswon: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      gameslost: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      winrate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      // --- CAMPOS SEMANALES (NUEVOS) ---
      weekly_gamesplayed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      weekly_gameswon: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      weekly_gameslost: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      weekly_winrate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      // --- FIN DE CAMPOS NUEVOS ---
      // Cambiamos a JSON para guardar un historial (ej: [5, 4, 5])
      attempts: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      streak: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // Acá se guardarán los días de racha del usuario
      lastWinDate: {
        type: DataTypes.DATEONLY, // Solo nos importa la fecha
        allowNull: true,
      },
      // Foreingkey para el usuario
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },
      // Foreignkey para el equipo
      teamId: {
        type: DataTypes.INTEGER,
        references: {
          model: "teams",
          key: "id",
        },
        allowNull: true, // "un jugador puede no tener equipo"
      },
    },
    {
      timestamps: false,
    }
  );
  return Stat;
};
export default StatModel;
