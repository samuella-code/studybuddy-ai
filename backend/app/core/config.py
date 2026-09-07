from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://studybuddy:studybuddy@localhost:5432/studybuddy"
    jwt_secret_key: str = "change-me"
    ai_provider: str = "openai"
    ai_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
