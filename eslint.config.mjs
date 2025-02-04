import globals from "globals";
import react from "eslint-plugin-react";

export default [
    {
        plugins: {
            react,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            },

            ecmaVersion: "latest",
            sourceType: "module",

            parserOptions: {
                project: ["tsconfig.json"],
            },

            extends: [
                "eslint:recommended",
                "eslint:import/errors",
                "eslint:import/wrarnings",
                "eslint:import/typescript",
                "plugin:@typescript-eslint/recommended",
                "plugin:react/recommended",
                "plugin:react-hooks/recommended",
            ],
        },

        rules: {
            "@typescript-eslint/no-dynamic-delete": ["off"],
            "@typescript-eslint/no-floating-promises": ["off"],
            "@typescript-eslint/no-misused-promises": ["off"],
            "@typescript-eslint/no-non-null-assertion": ["off"],
            "@typescript-eslint/no-unused-vars": ["warn"],
            "@typescript-eslint/prefer-nullish-coalescing": ["off"],
            "@typescript-eslint/promise-function-async": ["off"],
            "@typescript-eslint/restrict-plus-operands": ["off"],
            "@typescript-eslint/restrict-template-expressions": ["off"],
            "@typescript-eslint/strict-boolean-expressions": ["off"],
            "@typescript-eslint/triple-slash-reference": ["off"],
            "@typescript-eslint/consistent-type-assertions": ["off"],
            "react/react-in-jsx-scope": ["off"],
        },
    },
];
