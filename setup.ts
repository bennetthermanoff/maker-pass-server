/* eslint-disable no-console */
import { readFileSync, writeFileSync } from 'fs';
import prompts from 'prompts';
import { AdditionalInfoField, MakerspaceConfig } from './MakerspaceConfig';
import { v4 } from 'uuid';
import qrCode from 'qrcode-terminal';
import { hashSync } from 'bcrypt';

export const setup = async () => {
    console.log('Welcome to MakerPass! Let\'s get started by setting up your MakerSpace.');
    const setupQuestions = await prompts([
        {
            type: 'text',
            name: 'name',
            message: 'What is the name of your MakerSpace?',
        },
        {
            type: 'text',
            name: 'website',
            message: 'What is the website of your MakerSpace? This is optional.',
        },
        {
            type: 'text',
            name: 'serverAddress',
            message: 'What is the address of this server? This is the address users will use to connect to the server.',
            initial: 'http://localhost',
            validate: (value: string) => (value.startsWith('http') ? true : 'Please enter a valid URL starting with http:// or https://'),
        },
        {
            type: 'number',
            name: 'internalServerPort',
            message: 'What port should the server run on? This is an internal port that the server will run on.',
            initial: 8080,
            validate: (value: number) => (value > 0 && value < 65536 ? true : 'Please enter a valid port number between 1 and 65535'),
        },
        {
            type: 'toggle',
            name: 'differentExternalPort',
            message: 'Is the external port different from the internal port?',
        },
        {
            type: (prev: boolean) => (prev ? 'number' : null),
            name: 'externalServerPort',
            message: 'What port should the server run on externally? This is the port users will use to connect to the server.',
            initial: 8080,
            validate: (value: number) => (value > 0 && value < 65536 ? true : 'Please enter a valid port number between 1 and 65535'),
        },
        {
            type: 'number',
            name: 'mqttPort',
            message: 'What port should the MQTT server run on? This should be a secure port not exposed to the internet.',
            initial: 8883,
            validate: (value: number) => (value > 0 && value < 65536 ? true : 'Please enter a valid port number between 1 and 65535'),
        },
        {
            type: 'text',
            name: 'mqttUsername',
            message: 'Give a username to connect to the MQTT server.',
            initial: 'admin',
        },
        {
            type: 'text',
            name: 'mqttPassword',
            message: 'Give a password to connect to the MQTT server.',
            initial: 'admin',

        },
        {
            type: 'select',
            name: 'themePrimary',
            message: 'What is the primary color of your MakerSpace? This is used to theme the app.',
            choices: [
                { title: 'Orange', value: 'orange' },
                { title: 'Yellow', value: 'yellow' },
                { title: 'Green', value: 'green' },
                { title: 'Blue', value: 'blue' },
                { title: 'Purple', value: 'purple' },
                { title: 'Pink', value: 'pink' },
                { title: 'Red', value: 'red' },
            ],

        },
        {
            type: 'select',
            name: 'themeSecondary',
            message: 'What is the secondary color of your MakerSpace? This is used to theme the app.',
            choices: [
                { title: 'Orange', value: 'orange' },
                { title: 'Yellow', value: 'yellow' },
                { title: 'Green', value: 'green' },
                { title: 'Blue', value: 'blue' },
                { title: 'Purple', value: 'purple' },
                { title: 'Pink', value: 'pink' },
                { title: 'Red', value: 'red' },
            ],
        },
        {
            type: 'toggle',
            name: 'additionalInfo',
            message: 'Would you like to add additional information fields for users to fill out?',
        },
    ]);
    const additionalInfoFields = Array<AdditionalInfoField>();
    let additionalInfo = setupQuestions.additionalInfo as boolean;
    while (additionalInfo){
        const field = await prompts([
            {
                type: 'select',
                name: 'type',
                message: 'What type of field is this?',
                choices: [
                    { title: 'Text', value: 'text' },
                    { title: 'Number', value: 'number' },
                    { title: 'Phone Number', value: 'tel' },
                    { title: 'Multiple Choice', value: 'dropdown' },
                    { title: 'Date', value: 'date' },
                    { title: 'Boolean Checkbox (agree to terms)', value: 'checkbox' },
                ],
            },
            {
                type: 'text',
                name: 'name',
                message: 'Enter the prompt for this field',
            },
            {
                type: 'text',
                name: 'description',
                message: 'Any additional information about this field (subtext)?',
            },
            {
                type: (prev: { type: string }) => (prev.type === 'dropdown' ? 'list' : null),
                name: 'options',
                message: 'Enter the options for this field separated by commas',
            },
            {
                type: 'text',
                name: 'regEx',
                message: 'Enter a regular expression to validate this field (optional, only used for number or text fields)',
            },
            {
                type: 'toggle',
                name: 'required',
                message: 'Is this field required?',
            },
            {
                type: 'toggle',
                name: 'addAnother',
                message: 'Would you like to add another field?',
            },
        ]);
        const { addAnother, ...fieldWithoutAddAnother } = field;
        additionalInfoFields.push(fieldWithoutAddAnother);
        additionalInfo = addAnother;
    }
    console.log('Setup complete! Here is your MakerSpace configuration:');
    console.log(setupQuestions);
    console.log('Additional Info Fields:');
    console.log(additionalInfoFields);
    console.log('Would you like to save this configuration?');
    const save = await prompts({
        type: 'toggle',
        name: 'save',
        message: 'Would you like to save this configuration?',
    });
    if (save.save){
        const adminPassword = v4();
        const config: MakerspaceConfig = {
            id: v4(),
            name: setupQuestions.name,
            website: setupQuestions.website,
            serverAddress: setupQuestions.serverAddress,
            internalServerPort: setupQuestions.internalServerPort,
            externalServerPort: setupQuestions.differentExternalPort ? setupQuestions.externalServerPort : setupQuestions.internalServerPort,
            mqttPort: setupQuestions.mqttPort,
            mqttUsername: setupQuestions.mqttUsername,
            mqttPassword: setupQuestions.mqttPassword,
            adminPassword: hashSync(adminPassword, 10),
            registrationPassword: v4(),
            theme: {
                primary: setupQuestions.themePrimary,
                secondary: setupQuestions.themeSecondary,
            },
            additionalInfoFields };
        writeFileSync('MakerspaceConfig.json', JSON.stringify(config, null, 2));
        console.log('Configuration saved to MakerspaceConfig.json');

        await new Promise((resolve) => setTimeout(resolve, 200));
        console.log('Generating a new admin registration key...');
        await new Promise((resolve) => setTimeout(resolve, 200));
        console.log('Connect to the server with the following registration key, or use the QR code in the MakerPass app:');
        console.log('Admin Registration Key: ' + config.adminPassword);
        qrCode.generate(`makerpass://--/makerspace/config?url=${config.serverAddress}&port=${config.externalServerPort}&registrationType=admin&registrationKey=${adminPassword}`, { small: true }, (qrCode) => {
            console.log(qrCode);
        });
        console.log('To register as admin, press and hold the submit button on the register page.');
        console.log('DO NOT SAVE THIS KEY OR QR CODE. A non-admin registration key will be displayed when the server is started.');

    }
    console.log('Exiting... run `npm run forever` to start the server');

};

export const printWelcome = () => {
    const consoleWidth = process.stdout.columns;
    const banner = readFileSync(consoleWidth >= 100 ? 'banner100.txt' : 'banner40.txt', 'utf8');
    console.log(banner);
};