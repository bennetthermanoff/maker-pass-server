import { DataTypes, ModelAttributes } from 'sequelize';

export const tagOutModel:ModelAttributes = {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    machineId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    removedDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    removedBy: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    removedReason: {
        type: DataTypes.STRING,
        allowNull: true,
    },
};

export type TagOut = {
    id: string;
    machineId: string;
    userId: string;
    reason: string;
    removedDate: Date|null;
    removedBy: string|null;
    removedReason: string|null;
}