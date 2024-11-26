const config = {
    GOOGLE_TRANSLATE_API_KEY: "${{secrets.GOOGLE_TRANSLATE_API_KEY}}",
    OPEN_WEATHER_API_KEY: "${{secrets.OPEN_WEATHER_API_KEY}}",
    OPENAI_API_KEY: "${{secrets.OPEN_API_KEY}}"

};

// 다른 파일에서 사용할 수 있도록 내보내기
export default config;
