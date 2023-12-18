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
    tapUnlockKey: {
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
    solenoidMode: boolean;
    machineGroupId?: string;
    tapUnlockKey?: string;
    lastUsedBy?: string;
    latestTagOutId?: string;
}