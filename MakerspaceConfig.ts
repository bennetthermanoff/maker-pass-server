export const makerspaceConfig:MakerspaceConfig = {

    // a unique id for this makerspace, generate one at https://www.uuidgenerator.net/
    id:'d4b6e215-f616-425a-bdc3-527a7f9a7605',

    // The name of the makerspace
    name: 'Tulane Makerspace',

    // The website of the makerspace, comment out to disable
    website: 'https://makerspace.tulane.edu',

    // The server address of this server
    serverAddress: 'http://192.168.0.177',

    // The port of this server
    serverPort: 8080,

    // Password for creating an admin account
    adminPassword: 'admin',

    // Registration password for creating a user account
    registrationPassword: 'register',

    // Theme options
    // https://tamagui.dev/docs/intro/colors
    theme:{
        primary:'green',
        secondary:'blue',
    },
    additionalInfoFields: [ {
        name: 'Splash ID #',
        type: 'number',
        regEx: '^[0-9]{7,10}$',
        required: true,
    },
    {
        name: 'Phone Number',
        type: 'tel',
        required: true,
    },

    {
        name: 'Area of Study/Department',
        description: 'Tulane MakerSpace welcomes all students, faculty, and staff from all departments and schools. This information is used to help us better understand our users and their needs.',
        type: 'dropdown',
        options: [
            'Accounting',
            'Anthropology',
            'Applied Business Studies',
            'Applied Mathematics',
            'Architecture',
            'Art History',
            'Behavioral Health',
            'Biochemistry & Molecular Biology',
            'Biomedical Engineering',
            'Biomedical Sciences',
            'Biostatistics',
            'Business Administration',
            'Business Analytics',
            'Cell & Molecular Biology',
            'Chemical & Biomolecular Engineering',
            'Chemistry',
            'Classical Studies',
            'Communication',
            'Computer Science',
            'Dance',
            'Digital Media Production',
            'Ecology & Evolutionary Biology',
            'Economics',
            'Education',
            'Engineering Physics',
            'English',
            'Environmental Biology',
            'Environmental Science',
            'Film Studies',
            'Finance',
            'French',
            'Gender & Sexuality Studies',
            'Geology',
            'German',
            'Global Studies',
            'Health & Wellness',
            'Health Systems Management',
            'History',
            'Architecture',
            'Business',
            'Law',
            'Liberal Arts',
            'Medicine',
            'Professional Advancement',
            'Public Health & Tropical Medicine',
            'Science & Engineering',
            'Social Work',
        ],
        required: false,
    },
    {
        name: 'Graduation Year',
        type: 'number',
        regEx: '^[0-9]{4}$',
        required: true,
    },
    {
        name: 'Birthday',
        type: 'date',
        required: true,
    },
    {
        name:'I agree to the terms and conditions',
        type:'checkbox',
        required:true,
    },
    {
        name: 'How did you hear about us?',
        type: 'dropdown',
        options: [
            'Class',
            'Friend',
            'Event',
            'Website',
            'Social Media',
            'Other',
        ],
        required: true,
    },
    {
        name:'text',
        type:'text',
        required:true,
    },
    ],

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
    },
    additionalInfoFields?: AdditionalInfoField[]

};
type AdditionalInfoField = {
    name: string,
    description?:string,
    type: 'text' | 'number' | 'tel' | 'checkbox' | 'dropdown' | 'date',
    options?: string[],
    regEx?: string,
    required?: boolean
};
