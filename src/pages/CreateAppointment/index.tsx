import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {Platform} from 'react-native';
import { format } from 'date-fns'
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuth } from '../../hooks/auth';
import api from '../../services/api';

import {
  Container,
  Header,
  BackButton,
  HeaderTitle,
  UserAvatar,
  Content,
  ProvidersListContainer,
  ProvidersList,
  ProviderContainer,
  ProviderAvatar,
  ProviderName,
  Calendar,
  Title,
  OpenDatePickerButton,
  OpenDatePickerButtonText,
  Schedule,
  Section,
  SectionTitle,
  SectionContent,
  Hour,
  HourText,
} from './styles';

interface RouteParams {
  providerId: string;
}

export interface Provider{
  id: string;
  name: string;
  avatar_url:string;
}

export interface AvailabilityItem{
  hour: number;
  available: boolean;
}

const CreateAppointment: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute();
  const { goBack } = useNavigation();

  const routeParams = route.params as RouteParams;

  const [availability, setAvailability] = useState<AvailabilityItem[]>([])
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(routeParams.providerId);
  const [selectedDate, setSelectedDate] = useState(new Date);
  const [selectedHour, setSelectedHour] = useState(0);

  useEffect(() => {
    api.get('/providers').then(response => {
      setProviders(response.data);
    })
  }, []);

  useEffect(() => {
    api.get(`providers/${selectedProvider}/day-availability`, {
      params: {
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        day: selectedDate.getDate(),
      }
    }).then(response => {
      setAvailability(response.data);
    })
  }, [selectedDate, selectedProvider]);

  const navigateBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleSelectProvider = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
  }, []);

  const handleToggleDatePicker = useCallback(() => {
    setShowDatePicker((state) => !state);
  }, []);

  const handleDateChanged = useCallback((event: any, date: Date | undefined) => {
    if (Platform.OS === 'android'){
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date)
    }
  }, []);


  const morningAvailability = useMemo(() => {
    return availability
    .filter(({hour}) => hour < 12)
    .map(({hour, available}) => {
      return {
        hour,
        available,
        hourFormatted: format(new Date().setHours(hour), 'HH:00'),
      }
    });
  }, [availability]);

  const afternoonAvailability = useMemo(() => {
    return availability
    .filter(({hour}) => hour >= 12)
    .map(({hour, available}) => {
      return {
        hour,
        available,
        hourFormatted: format(new Date().setHours(hour), 'HH:00'),
      }
    });
  }, [availability]);

  const handleSelecHour = useCallback((hour: number) =>{
    setSelectedHour(hour);
  }, [setSelectedHour]);

  return (
  <Container>
    <Header>
      <BackButton onPress={navigateBack} >
        <Icon name="chevron-left" size={24} color="#999591" />
      </BackButton>

      <HeaderTitle>Cabeleireiros</HeaderTitle>

      <UserAvatar source={{uri: user.avatar_url}} />
    </Header>

    <Content>
      <ProvidersListContainer>
        <ProvidersList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={providers}
          keyExtractor={provider => provider.id}
          renderItem={({item: provider}) => (
            <ProviderContainer
              onPress={() => handleSelectProvider(provider.id)}
              selected={provider.id === selectedProvider}
            >
              <ProviderAvatar source={{uri: provider.avatar_url}} />
              <ProviderName selected={provider.id === selectedProvider}>{provider.name}</ProviderName>
            </ProviderContainer>
          )}
        />
      </ProvidersListContainer>
      <Calendar>
        <Title> Escolha a data</Title>
        <OpenDatePickerButton onPress={handleToggleDatePicker}>
          <OpenDatePickerButtonText>Selecione outra data</OpenDatePickerButtonText>
        </OpenDatePickerButton>
        {showDatePicker && (<DateTimePicker
          value={ selectedDate }
          mode="date"
          display="calendar"
          onChange={handleDateChanged}
        />)}
      </Calendar>

      <Schedule>
        <Title>Escolha um horário</Title>
        <Section>
          <SectionTitle>Manhã</SectionTitle>

          <SectionContent>
            {morningAvailability.map(({hourFormatted, hour, available}) => (
              <Hour
                selected={selectedHour === hour}
                enabled={available}
                available={available}
                key={hourFormatted}
                onPress={() => handleSelecHour(hour)}
              >
                <HourText selected={selectedHour === hour}>{hourFormatted}</HourText>
              </Hour>
            ))}
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle>Tarde</SectionTitle>

          <SectionContent>
            {afternoonAvailability.map(({hourFormatted, hour, available}) => (
              <Hour
                selected={selectedHour === hour}
                enabled={available}
                available={available}
                key={hourFormatted}
                onPress={() => handleSelecHour(hour)}
              >
                <HourText selected={selectedHour === hour}>{hourFormatted}</HourText>
              </Hour>
            ))}
          </SectionContent>
        </Section>
      </Schedule>
    </Content>


  </Container>);
}

export default CreateAppointment;
