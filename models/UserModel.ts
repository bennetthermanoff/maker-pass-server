import { DataTypes, ModelAttributes } from 'sequelize';

export const userModel:ModelAttributes = {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
    },
    accessToken:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    userType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    additionalInfo: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: true,
    },
    preferences: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: true,
    },
};

export type User = {
    id: string;
    name: string;
    email: string;
    password: string;
    accessToken?: string;
    userType: UserType;
    additionalInfo?: object;
    preferences?: object;
}
export type UserType = 'admin' | 'user' | 'technician';