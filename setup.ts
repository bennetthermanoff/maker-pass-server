/* eslint-disable no-console */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import prompts from 'prompts';
import { AdditionalInfoField, MakerspaceConfig } from './MakerspaceConfig';
import { v4 } from 'uuid';
import qrCode from 'qrcode-terminal';
import { hashSync } from 'bcrypt';
import { execSync } from 'child_process';
import { UserDB, sequelize } from './models';
import { exit } from 'process';

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
            type: 'toggle',
            name: 'useNgrok',
            message: 'Would you like to use ngrok to expose your server to the internet?',
        },
        {
            type: (prev) => (prev ? 'text' : null),
            name: 'ngrokToken',
            message: 'What is your ngrok authtoken? This is required to use ngrok.',
            validate: (value: string) => (value.length > 0 ? true : 'Please enter a valid ngrok authtoken'),
        },
        {
            type: (_prev, values) => (values.useNgrok ? 'text' : null),
            name: 'ngrokDomain',
            message: 'What is your ngrok static domain EX: (cool-domain.ngrok-free.app)? \nGenerate one at: https://dashboard.ngrok.com/cloud-edge/domains ',
            validate: (value: string) => (value.length > 0 ? true : 'Please enter a valid ngrok domain'),

        },
        {
            type: (_prev, values) => (values.useNgrok ? null : 'text'),
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

            type: (_prev, values ) => (values.useNgrok ? null : 'number'),
            name: 'differentExternalPort',
            message: 'Is the external port different from the internal port?',
        },
        {
            type: (_prev, values) => (values.differentExternalPort ? 'number' : null),
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
            type: 'toggle',
            name: 'mqttSecure',
            message: 'Would you like to enable TLS for the MQTT server? (NOTE: Tasmota does not support TLS by default)\n You do really don\'t need to enable this unless you are exposing the MQTT server to the internet (ngrok will not do this).',
        },
        {
            type: 'text',
            name: 'mqttUsername',
            message: 'Give a username for devices to connect to the MQTT server.',
            initial: 'admin',
        },
        {
            type: 'text',
            name: 'mqttPassword',
            message: 'Give a password for devices to connect to the MQTT server.',
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
        initial: true,
    });
    if (save.save){

        const config: MakerspaceConfig = {
            id: v4(),
            name: setupQuestions.name,
            website: setupQuestions.website,
            serverAddress: setupQuestions.ngrokDomain ? setupQuestions.ngrokDomain : setupQuestions.serverAddress,
            ngrokToken: setupQuestions.useNgrok ? setupQuestions.ngrokToken : undefined,
            ngrokStaticDomain: setupQuestions.ngrokDomain,
            internalServerPort: setupQuestions.internalServerPort,
            externalServerPort: !setupQuestions.ngrokToken
                ? setupQuestions.differentExternalPort
                    ? setupQuestions.externalServerPort : setupQuestions.internalServerPort
                : 443,
            mqttSecure: setupQuestions.mqttSecure,
            mqttPort: setupQuestions.mqttPort,
            mqttUsername: setupQuestions.mqttUsername,
            mqttPassword: setupQuestions.mqttPassword,
            registrationPassword: v4(),
            theme: {
                primary: setupQuestions.themePrimary,
                secondary: setupQuestions.themeSecondary,
            },
            additionalInfoFields };
        writeFileSync('MakerspaceConfig.json', JSON.stringify(config, null, 2));
        console.log('Configuration saved to MakerspaceConfig.json');

        const adminEmail = await prompts({
            type: 'text',
            name: 'email',
            message: 'An admin registration key will be generated. What is the email of the admin?',
            validate: (value: string) => (RegExp('.+@.+').test(value) ? true : 'Please enter a valid email address'),
            initial: 'admin@email.com',
        });
        const adminName = await prompts({
            type: 'text',
            name: 'name',
            message: 'Enter the name of the admin user',
            initial: 'Admin',
        });
        const adminPassword = await prompts({
            type: 'password',
            name: 'password',
            message: 'Enter a password for the admin account',
            validate: (value: string) => (value.length > 7 ? true : 'Password must be at least 8 characters'),
        });
        let verified = false;
        while (!verified){
            const verify = await prompts({
                type: 'password',
                name: 'password',
                message: 'Please enter the password again to verify',
            });
            verified = verify.password === adminPassword.password;
            if (!verified){
                console.log('Passwords do not match. Please try again.');
            }
        }
        await sequelize.sync();
        const numAdmins = await UserDB.count({ where: { userType: 'admin' } });
        if (numAdmins > 0){
            console.log('WARNING: There is already an admin registered in the database. No new admin will be created.');
        } else {
            const hashedPassword = hashSync(adminPassword.password, 10);
            await UserDB.create({ email: adminEmail.email, name:adminName.name, password: hashedPassword, userType: 'admin', additionalInfo:'{}' });
            console.log('Admin created with email: ', adminEmail.email);
        }

        await handleMqttsCerts(config);

        await new Promise((resolve) => setTimeout(resolve, 200));
        console.log('Generating a new admin registration key...');
        await new Promise((resolve) => setTimeout(resolve, 200));
        console.log('User Registration Key: ' + config.registrationPassword);
        console.log('Once the server is running, you can use the following QR code to connect to the server:');
        qrCode.generate(`makerpass://--/makerspace/config?url=${config.ngrokToken ? 'https://' : ''}${config.serverAddress}&port=${config.externalServerPort}&registrationType=user&registrationKey=${config.registrationPassword}`, { small: true }, (qrCode) => {
            console.log(qrCode);
            exit();
        });

    } else {
        console.log('Would you like to start over?');
        const startOver = await prompts({
            type: 'toggle',
            name: 'startOver',
            message: 'Would you like to start over?',
            initial: true,
        });
        if (startOver.startOver){
            setup();
        } else {
            console.log('Exiting setup...');
            exit();
        }
    }

};

export const printWelcome = () => {
    const consoleWidth = process.stdout.columns;
    const banner = readFileSync(consoleWidth >= 100 ? 'banner100.txt' : 'banner40.txt', 'utf8');
    console.log(banner);
};

const handleMqttsCerts = async (config:MakerspaceConfig) => {
    if (!config.mqttSecure){
        return;
    }

    if (existsSync('certs/server.key') && existsSync('certs/server.crt')){
        console.log('Existing mqtt certs found. Assuming they are signed for your domain.');
        return;
    }

    const response = await prompts([{
        type: 'toggle',
        name: 'generateCerts',
        message: 'Would you like to generate new self-signed certs for mqtts?',
    },
    { type: 'toggle',
        name: 'certAddress',
        message: `Would you like to use the server address ${config.serverAddress} as the common name for the certificate?`,
    },
    { type: (prev) => (prev ? null : 'text'),
        name: 'certAddress',
        message: 'What address should be used for the certificate?',
    }]);
    if (!response.generateCerts){
        return;
    }
    if (response.certAddress){
        config.serverAddress = response.certAddress;
    }
    console.log('Generating self-signed certs for mqtts... (you need to have openssl installed)');
    try {
        execSync('mkdir -p certs');
        execSync(`openssl req -nodes -new -x509 -keyout certs/server.key -out certs/server.crt -subj "/CN=${config.serverAddress}"`);
        console.log('Certs generated and saved to certs/server.key and certs/server.crt');
    } catch (e){
        console.error(`Error generating certs. Make sure you have openssl installed run: \nopenssl req -nodes -new -x509 -keyout certs/server.key -out certs/server.crt -subj "/CN=${config.serverAddress}"`);
    }
};
