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
    photoContentType: {
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
    },
    solenoidMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    machineGroupId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'machineGroup',
            key: 'id',
        },
    },
    enableKey: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lastUsedBy: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'user',
            key: 'id',
        },
    },
    latestTagOutId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'tagOut',
            key: 'id',
        },
    },
};

export type Machine = {
    id: string;
    name: string;
    photo?: string;
    photoContentType?: string;
    mqttTopic?: string;
    enabled: boolean;
    solenoidMode: boolean;
    machineGroupId?: string;
    enableKey?: string;
    lastUsedBy?: string;
    latestTagOutId?: string;
}