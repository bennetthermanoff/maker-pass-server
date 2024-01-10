import { DataTypes, ModelAttributes } from 'sequelize';

export const machineModel:ModelAttributes = {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    photo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    photoHash: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    mqttTopic: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    solenoidMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    enableKey: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lastUsedBy: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    latestTagOutId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
};

export type Machine = {
    id: string;
    name: string;
    photo: string|null;
    photoHash: string|null;
    mqttTopic: string|null;
    enabled: boolean;
    solenoidMode: boolean;
    enableKey: string|null;
    lastUsedBy: string|null;
    latestTagOutId: string|null;
}