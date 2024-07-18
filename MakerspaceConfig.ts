export type MakerspaceConfig = {
    id: string,
    name: string,
    website?: string,
    serverAddress: string,
    internalServerPort: number,
    externalServerPort: number,
    mqttSecure: boolean,
    mqttPort: number,
    mqttUsername: string,
    mqttPassword: string,
    adminPassword: string,
    registrationPassword: string,
    ngrokToken?: string,
    ngrokStaticDomain?: string,
    theme: {
        primary: string,
        secondary: string,
    },
    additionalInfoFields?: AdditionalInfoField[]

};
export type AdditionalInfoField = {
    name: string,
    description?:string,
    type: 'text' | 'number' | 'tel' | 'checkbox' | 'dropdown' | 'date',
    options?: string[],
    regEx?: string,
    required?: boolean
};
