import React, { useState, useEffect } from 'react';
import type { GoutForecast, GoutForecastDay } from '../types';
import { generateGoutForecast } from '../services/geminiService';
import { type Language, type TranslationKey } from '../translations';
import { SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon, TrendingUpIcon } from './IconComponents';

interface GoutForecastProps {
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  lang: Language;
}

const weatherIconMap: { [key: string]: React.FC<{ className?: string }> } = {
  'Sunny': SunIcon,
  'Cloudy': CloudIcon,
  'Rainy': CloudRainIcon,
  'Stormy': CloudLightningIcon,
};

const getIndexClasses = (index: string) => {
    switch (index) {
        case 'Good':
            return {
                bg: 'bg-green-500/20',
                text: 'text-green-300',
                labelKey: 'goutIndexGood' as const
            };
        case 'Moderate':
            return {
                bg: 'bg-yellow-500/20',
                text: 'text-yellow-300',
                labelKey: 'goutIndexModerate' as const
            };
        case 'Caution':
            return {
                bg: 'bg-orange-500/20',
                text: 'text-orange-300',
                labelKey: 'goutIndexCaution' as const
            };
        case 'High Risk':
            return {
                bg: 'bg-red-500/20',
                text: 'text-red-300',
                labelKey: 'goutIndexHighRisk' as const
            };
        default:
            return {
                bg: 'bg-zinc-700',
                text: 'text-zinc-300',
                labelKey: null
            };
    }
};

const GoutForecast: React.FC<GoutForecastProps> = ({ t, lang }) => {  
  const [forecastData, setForecastData] = useState<GoutForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<'generic' | 'user'>('generic');
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async (coords?: GeolocationCoordinates) => {
      setIsLoading(true);
      setError(null);
      try {
        const location = coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined;
        // Caching logic - v4 includes location awareness
        const cacheKey = location 
            ? `goutForecast_v4_${lang}_${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}`
            : `goutForecast_v4_${lang}_generic`;
        const cachedData = localStorage.getItem(cacheKey);
        const now = new Date().getTime();

        if (cachedData) {
          const { timestamp, data } = JSON.parse(cachedData);
          // Cache for 4 hours
          if (now - timestamp < 4 * 60 * 60 * 1000) {
            setForecastData(data);
            setLocationSource(location ? 'user' : 'generic');
            setIsLoading(false);
            return;
          }
        }

        const responseJson = await generateGoutForecast(lang, location);
        const data = JSON.parse(responseJson) as GoutForecast;
        
        if (data.forecast && data.forecast.length > 7) {
            data.forecast = data.forecast.slice(0, 7);
        }

        setForecastData(data);
        setLocationSource(location ? 'user' : 'generic');
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data }));

      } catch (e) {
        console.error("Failed to fetch or parse gout forecast", e);
        setError("Could not load forecast.");
      } finally {
        setIsLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchForecast(position.coords);
        },
        (geoError) => {
          console.warn(`Geolocation error: ${geoError.message}`);
          setLocationError(t('locationErrorGeneric'));
          fetchForecast(); // Fetch generic forecast without location
        }
      );
    } else {
      setLocationError(t('locationErrorNotSupported'));
      fetchForecast(); // Fetch generic forecast without location
    }
  }, [lang, t]);
  
  const renderSkeleton = () => (
     <div className="bg-zinc-800 rounded-lg p-4 animate-pulse">
        <div className="h-5 bg-zinc-700 rounded-md w-1/2 mb-1"></div>
        <div className="h-3 bg-zinc-700 rounded-md w-1/3 mb-4"></div>

        <div className="flex justify-between items-center text-center">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                    <div className="h-4 bg-zinc-700 rounded w-8"></div>
                    <div className="w-8 h-8 bg-zinc-700 rounded-full"></div>
                    <div className="h-3 bg-zinc-700 rounded w-10"></div>
                </div>
            ))}
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-700/50 flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
                 <div key={i}>
                    <div className="h-4 bg-zinc-700 rounded w-1/4 mb-2"></div>
                    <div className="bg-zinc-900/50 p-3 rounded-lg flex items-start gap-4 min-h-[80px]">
                        <div className="h-10 bg-zinc-700 rounded w-20 flex-shrink-0 mt-1"></div>
                        <div className="flex flex-col gap-2 w-full pt-1">
                            <div className="h-3 bg-zinc-700 rounded w-full"></div>
                            <div className="h-3 bg-zinc-700 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  )

  if (isLoading) {
    return renderSkeleton();
  }

  if (error || !forecastData || !forecastData.forecast || forecastData.forecast.length < 2) {
    return (
      <div className="bg-zinc-800 rounded-lg p-4 text-center text-red-400">
        <p>{error || "Forecast data is unavailable."}</p>
      </div>
    );
  }

  const todayForecast = forecastData.forecast[0];
  const tomorrowForecast = forecastData.forecast[1];

  const DetailCard: React.FC<{ title: string, data: GoutForecastDay }> = ({ title, data }) => (
    <div>
        <h4 className="text-sm font-semibold text-zinc-300 mb-1">{title}</h4>
        <div className="bg-zinc-900/50 p-3 rounded-lg flex items-start gap-4">
            <div className={`text-5xl font-bold flex-shrink-0 w-20 text-center ${getIndexClasses(data.goutIndex).text}`}>
                {new Intl.NumberFormat(lang).format(data.goutIndexNumeric)}
            </div>
            <p className="text-sm text-zinc-400 pt-1">{data.explanation}</p>
        </div>
    </div>
  );
  
  const forecastSourceText = locationSource === 'user' 
    ? t('forecastSourceUser') 
    : t('forecastSourceGeneric');


  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <h3 className="flex items-center text-md font-semibold text-sky-300 mb-1">
        <TrendingUpIcon className="w-5 h-5 mr-2 flex-shrink-0" />
        {t('goutForecastTitle')}
      </h3>
      <p className="text-xs text-zinc-400 mb-3">{forecastSourceText}</p>
      
      {locationError && (
        <div className="bg-amber-900/50 border border-amber-700 text-amber-300 text-xs px-3 py-2 rounded-md mb-3" role="alert">
          {locationError}
        </div>
      )}

      <div className="flex justify-around items-start text-center">
        {forecastData.forecast.map((day, index) => {
            const WeatherIcon = weatherIconMap[day.weather] || CloudIcon;
            let dayName: string;

            if (index === 0) {
                dayName = t('today');
            } else if (index === 1) {
                dayName = t('tomorrow');
            } else {
                const dayIndex = (new Date().getDay() + index) % 7;
                dayName = t(`forecastDay${dayIndex}` as TranslationKey);
            }
            
            const {bg, text, labelKey} = getIndexClasses(day.goutIndex);

            return (
                <div key={index} className="flex flex-col items-center space-y-1 w-12 group" title={day.explanation}>
                    <p className={`text-sm font-semibold ${index === 0 ? 'text-teal-300' : 'text-zinc-300'}`}>{dayName}</p>
                    <WeatherIcon className="w-8 h-8 text-zinc-400 my-1 group-hover:scale-110 transition-transform" />
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${bg} ${text}`}>
                        {labelKey ? t(labelKey) : day.goutIndex}
                    </span>
                </div>
            );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-700 flex flex-col gap-3">
        <DetailCard title={t('today')} data={todayForecast} />
        <DetailCard title={t('tomorrow')} data={tomorrowForecast} />
      </div>

    </div>
  );
};

export default GoutForecast;