class Config {
    public BE_BASE_URL: string = process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:8000";
}

const config = new Config();
export default config;