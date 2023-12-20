export const makerspaceConfig:MakerspaceConfig = {

    // a unique id for this makerspace, generate one at https://www.uuidgenerator.net/
    id:'d4b6e215-f616-425a-bdc3-527a7f9a7605',

    // The name of the makerspace
    name: 'Tulane Makerspace',

    // The website of the makerspace, comment out to disable
    website: 'https://makerspace.tulane.edu',

    // The server address of this server
    serverAddress: 'https://makerPass.tulane.edu',

    // The port of this server
    serverPort: 8080,

    // Password for creating an admin account, encrypted with bcrypt (https://bcrypt-generator.com/). Default is 'admin'
    adminPassword: '$2a$12$i8R0af71zAH06EStCI1ApOexcQR0Lzi9hO5Ct/004IJzsKVs.IJna',

    // Registration password for creating a user account, encrypted with bcrypt (https://bcrypt-generator.com/). Default is 'register'
    registrationPassword: '$2a$12$beYcV/mUYD7vGQqYj4sZDe0B/dXPHOFB.Rus.6iDaGPzNc9ISWMZm',

    // Theme options
    // https://tamagui.dev/docs/intro/colors
    theme:{
        primary:'green',
        secondary:'blue',
    },
};

type MakerspaceConfig = {
    id: string,
    name: string,
    website?: string,
    serverAddress: string,
    serverPort: number,
    adminPassword: string,
    registrationPassword: string,
    theme: {
        primary: string,
        secondary: string,
    }
};
