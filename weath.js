document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById("city-input");
    const getWeatherBtn = document.getElementById("get-weather-btn");
    const weatherInfo = document.getElementById("weather-info");
    const cityName = document.getElementById("city-name");
    const temperatureInfo = document.getElementById("temperature");
    const humidityInfo = document.getElementById("humidity");
    const descriptionInfo = document.getElementById("description");
    const errorInfo = document.getElementById("error-message");
    const dayNightIcon = document.getElementById("day-night-icon");
    const timeInfo = document.getElementById("time-info");
    const maxTemperatureInfo = document.getElementById("max-temperature");
    const minTemperatureInfo = document.getElementById("min-temperature");
    const loadingIndicator = document.getElementById("loading");
    const hourlyCards = document.getElementById("hourly-cards");
    const weeklyCards = document.getElementById("weekly-cards");
    const searchHistory = document.getElementById("search-history");

    const API_KEY = "091e7e237bc9498c34c0e911603d0195";
    let currentUnit = 'celsius';
    let searchHistoryItems = JSON.parse(localStorage.getItem('searchHistory')) || [];

    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('img');
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    getWeatherBtn.addEventListener('click', getWeather);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') getWeather();
    });
    themeToggle.addEventListener('click', toggleTheme);

    const unitToggleBtns = document.querySelectorAll('.unit-toggle button');
    const scrollLeftBtn = document.querySelector('.scroll-btn.left');
    const scrollRightBtn = document.querySelector('.scroll-btn.right');

    unitToggleBtns.forEach(btn => btn.addEventListener('click', toggleUnit));
    scrollLeftBtn?.addEventListener('click', () => scrollHourlyCards('left'));
    scrollRightBtn?.addEventListener('click', () => scrollHourlyCards('right'));

    async function getWeather() {
        const city = cityInput.value.trim();
        if (!city) return showError("Please enter a city name.");
        showLoading(true);
        try {
            const weatherData = await fetchWeatherData(city);
            const forecastData = await fetchForecastData(city);
            updateSearchHistory(city);
            displayWeatherData(weatherData);
            displayHourlyForecast(forecastData);
            displayWeeklyForecast(forecastData);
        } catch (error) {
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }

    function toggleUnit(e) {
        const newUnit = e.target.id;
        if (currentUnit !== newUnit) {
            currentUnit = newUnit;
            unitToggleBtns.forEach(btn => btn.classList.toggle('active'));
            if (!weatherInfo.classList.contains('hidden')) getWeather();
        }
    }

    function scrollHourlyCards(direction) {
        const scrollAmount = direction === 'left' ? -300 : 300;
        gsap.to(hourlyCards, {
            scrollLeft: `+=${scrollAmount}`,
            duration: 0.5,
            ease: "power2.out"
        });
    }

    async function fetchWeatherData(city) {
        const units = currentUnit === 'celsius' ? 'metric' : 'imperial';
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&appid=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("City not found");
        return response.json();
    }

    async function fetchForecastData(city) {
        const units = currentUnit === 'celsius' ? 'metric' : 'imperial';
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${units}&appid=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Forecast data not available");
        return response.json();
    }

    function displayWeatherData(data) {
        const { name, main, weather, sys } = data;
        const unit = currentUnit === 'celsius' ? '°C' : '°F';
        cityName.textContent = name;
        temperatureInfo.textContent = `Temperature: ${main.temp.toFixed(1)}${unit}`;
        humidityInfo.textContent = `Humidity: ${main.humidity}%`;
        descriptionInfo.textContent = `Weather: ${weather[0].description}`;
        maxTemperatureInfo.textContent = `Max: ${main.temp_max.toFixed(1)}${unit}`;
        minTemperatureInfo.textContent = `Min: ${main.temp_min.toFixed(1)}${unit}`;
        const isDay = sys.sunrise * 1000 < Date.now() && Date.now() < sys.sunset * 1000;
        dayNightIcon.src = isDay
            ? "https://cdn-icons-png.flaticon.com/128/869/869869.png"
            : "https://cdn-icons-png.flaticon.com/128/2033/2033764.png";
        timeInfo.textContent = isDay ? "Daytime" : "Nighttime";
        weatherInfo.classList.remove('hidden');
        errorInfo.classList.add('hidden');
    }

    function displayHourlyForecast(data) {
        const unit = currentUnit === 'celsius' ? '°C' : '°F';
        const hourlyData = data.list.slice(0, 8);
        hourlyCards.innerHTML = hourlyData.map(item => `
            <div class="hourly-card">
                <p>${new Date(item.dt * 1000).getHours()}:00</p>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="weather icon">
                <p>${item.main.temp.toFixed(1)}${unit}</p>
            </div>
        `).join('');
    }

    function displayWeeklyForecast(data) {
        const unit = currentUnit === 'celsius' ? '°C' : '°F';
        const dailyData = data.list.filter(item => new Date(item.dt * 1000).getHours() === 12).slice(0, 5);
        weeklyCards.innerHTML = dailyData.map(item => `
            <div class="weekly-card">
                <h4>${new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' })}</h4>
                <div class="weekly-details">
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="weather icon">
                    <p>${item.main.temp.toFixed(1)}${unit}</p>
                    <p>${item.weather[0].description}</p>
                </div>
            </div>
        `).join('');
    }

    function updateSearchHistory(city) {
        if (!searchHistoryItems.includes(city)) {
            searchHistoryItems.unshift(city);
            if (searchHistoryItems.length > 5) searchHistoryItems.pop();
            localStorage.setItem('searchHistory', JSON.stringify(searchHistoryItems));
            displaySearchHistory();
        }
    }

    function displaySearchHistory() {
        searchHistory.innerHTML = searchHistoryItems
            .map(city => `<button class="history-item">${city}</button>`)
            .join('');
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                cityInput.value = item.textContent;
                getWeather();
            });
        });
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        themeIcon.src = theme === 'light'
            ? 'https://cdn-icons-png.flaticon.com/128/5558/5558226.png'
            : 'https://cdn-icons-png.flaticon.com/128/7645/7645197.png';
    }

    function showError(message) {
        weatherInfo.classList.add('hidden');
        errorInfo.classList.remove('hidden');
        errorInfo.textContent = message;
    }

    function showLoading(isLoading) {
        loadingIndicator.classList.toggle('hidden', !isLoading);
        if (isLoading) {
            weatherInfo.classList.add('hidden');
            errorInfo.classList.add('hidden');
        }
    }

    displaySearchHistory();
});

