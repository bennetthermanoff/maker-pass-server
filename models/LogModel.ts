import { DataTypes, ModelAttributes } from 'sequelize';

export const logModel:ModelAttributes = {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    referenceId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    referenceType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
};

export type Log ={
    id: string,
    type: string,
    message: string,
    referenceId: string|null,
    referenceType: string|null,
    userId: string|null,
}
