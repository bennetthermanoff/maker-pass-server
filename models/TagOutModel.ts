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
        references: {
            model: 'machines',
            key: 'id',
        },
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
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
        references: {
            model: 'users',
            key: 'id',
        },
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
    removedDate?: Date;
    removedBy?: string;
    removedReason?: string;
}