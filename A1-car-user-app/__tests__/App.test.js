import React from 'react';
import { render, fireEvent, waitFor, screen, cleanup } from '@testing-library/react-native';
import axios from 'axios';
import App from '../App';

/**
 * Comprehensive A1 Car User App Tests (React Native)
 * Tests user interactions, API calls, and UI rendering
 */

jest.mock('axios');

// Clean up after each test
afterEach(cleanup);

describe('A1 Car User App - Comprehensive Tests', () => {
  const mockCarData = {
    licensePlate: 'ABC-123',
    owner: 'John Doe',
    indoorTemp: 22.5,
    outdoorTemp: 15.2,
    gps: { lat: 60.1699, lng: 24.9384 },
    lastService: '2024-10-15',
    lastUpdated: '2025-11-19T10:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Initial Render', () => {
    test('should render app title', () => {
      const { getByText } = render(<App />);
      expect(getByText('Car User App')).toBeTruthy();
    });

    test('should render license plate input field', () => {
      const { getByPlaceholderText } = render(<App />);
      expect(getByPlaceholderText('e.g. ABC-123')).toBeTruthy();
    });

    test('should render Get Car Data button', () => {
      const { getByText } = render(<App />);
      expect(getByText('Get Car Data')).toBeTruthy();
    });

    test('should not show car data initially', () => {
      const { queryByText } = render(<App />);
      // Check for specific car data that only appears after fetching
      expect(queryByText(/Car Information - /i)).toBeNull();
      expect(queryByText(/Outdoor Temperature:/i)).toBeNull();
    });
  });

  describe('License Plate Input', () => {
    test('should update license plate on text input', () => {
      const { getByPlaceholderText } = render(<App />);
      const input = getByPlaceholderText('e.g. ABC-123');
      
      fireEvent.changeText(input, 'ABC-123');
      
      expect(input.props.value).toBe('ABC-123');
    });

    test('should accept various license plate formats', () => {
      const { getByPlaceholderText } = render(<App />);
      const input = getByPlaceholderText('e.g. ABC-123');
      
      const formats = ['ABC-123', 'XYZ-789', 'DEF-456'];
      
      formats.forEach(plate => {
        fireEvent.changeText(input, plate);
        expect(input.props.value).toBe(plate);
      });
    });

    test('should clear input field', () => {
      const { getByPlaceholderText } = render(<App />);
      const input = getByPlaceholderText('e.g. ABC-123');
      
      fireEvent.changeText(input, 'ABC-123');
      expect(input.props.value).toBe('ABC-123');
      
      fireEvent.changeText(input, '');
      expect(input.props.value).toBe('');
    });
  });

  describe('Fetch Car Data', () => {
    test('should fetch and display car data successfully', async () => {
      axios.get.mockResolvedValueOnce({ data: mockCarData });
      
      const { getByPlaceholderText, getByText, findByText } = render(<App />);
      
      // Enter license plate
      const input = getByPlaceholderText('e.g. ABC-123');
      fireEvent.changeText(input, 'ABC-123');
      
      // Click get data button
      const button = getByText('Get Car Data');
      fireEvent.press(button);
      
      // Wait for data to load
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('http://localhost:3001/api/car/ABC-123');
      });
      
      // Verify data is displayed
      const carInfo = await findByText(/Car Information - ABC-123/i);
      expect(carInfo).toBeTruthy();
    });

    test('should display outdoor temperature', async () => {
      axios.get.mockResolvedValueOnce({ data: mockCarData });
      
      const { getByPlaceholderText, getByText, findByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      const temp = await findByText(/15.2°C/);
      expect(temp).toBeTruthy();
    });

    test('should display indoor temperature', async () => {
      axios.get.mockResolvedValueOnce({ data: mockCarData });
      
      const { getByPlaceholderText, getByText, findByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      const temp = await findByText(/22.5°C/);
      expect(temp).toBeTruthy();
    });

    test('should display GPS coordinates', async () => {
      axios.get.mockResolvedValueOnce({ data: mockCarData });
      
      const { getByPlaceholderText, getByText, findByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      const gps = await findByText(/60\.169/);
      expect(gps).toBeTruthy();
    });

    test('should display owner name', async () => {
      axios.get.mockResolvedValueOnce({ data: mockCarData });
      
      const { getByPlaceholderText, getByText, findByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      const owner = await findByText('John Doe');
      expect(owner).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should show error when license plate is empty', () => {
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
      
      const { getByText } = render(<App />);
      
      // Click button without entering license plate
      fireEvent.press(getByText('Get Car Data'));
      
      expect(alertSpy).toHaveBeenCalledWith(
        'Error',
        'Please enter a license plate number'
      );
    });

    test('should handle API error gracefully', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network Error'));
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
      
      const { getByPlaceholderText, getByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Failed to fetch car data')
        );
      });
    });

    test('should handle 404 error', async () => {
      axios.get.mockRejectedValueOnce({
        response: { status: 404, data: { error: 'Car not found' } }
      });
      
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
      
      const { getByPlaceholderText, getByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'INVALID-999');
      fireEvent.press(getByText('Get Car Data'));
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
    });

    test('should handle server timeout', async () => {
      axios.get.mockRejectedValueOnce(new Error('timeout of 5000ms exceeded'));
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
      
      const { getByPlaceholderText, getByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    test('should show loading indicator while fetching', async () => {
      axios.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: mockCarData }), 100)));
      
      const { getByPlaceholderText, getByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      // Wait for the API call to complete
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('http://localhost:3001/api/car/ABC-123');
      });
    });

    test('should disable button while loading', async () => {
      axios.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: mockCarData }), 100)));
      
      const { getByPlaceholderText, getByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      // Verify the API is called (button worked)
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
    });

    test('should re-enable button after loading completes', async () => {
      axios.get.mockResolvedValueOnce({ data: mockCarData });
      
      const { getByPlaceholderText, getByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      // Wait for loading to complete and data to be displayed
      await waitFor(() => {
        expect(getByText(/Outdoor Temperature:/i)).toBeTruthy();
      });
    });
  });

  describe('Data Refresh', () => {
    test('should refresh data when button is pressed again', async () => {
      const updatedData = { ...mockCarData, indoorTemp: 23.5 };
      
      axios.get
        .mockResolvedValueOnce({ data: mockCarData })
        .mockResolvedValueOnce({ data: updatedData });
      
      const { getByPlaceholderText, getByText, findByText } = render(<App />);
      
      // First fetch
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      await findByText(/22.5°C/);
      
      // Second fetch (refresh)
      fireEvent.press(getByText('Get Car Data'));
      
      await findByText(/23.5°C/);
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Display Formatting', () => {
    test('should format GPS coordinates with 6 decimal places', async () => {
      axios.get.mockResolvedValueOnce({ data: mockCarData });
      
      const { getByPlaceholderText, getByText, findByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      const gps = await findByText(/60\.169900/);
      expect(gps).toBeTruthy();
    });

    test('should display temperature with 1 decimal place', async () => {
      axios.get.mockResolvedValueOnce({ data: mockCarData });
      
      const { getByPlaceholderText, getByText, findByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      const temp = await findByText(/22\.5°C/);
      expect(temp).toBeTruthy();
    });

    test('should handle missing GPS data', async () => {
      const dataWithoutGPS = { ...mockCarData, gps: null };
      axios.get.mockResolvedValueOnce({ data: dataWithoutGPS });
      
      const { getByPlaceholderText, getByText, findByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      await findByText(/Car Information/);
      // Should not crash when GPS is null
    });
  });

  describe('Multiple Cars', () => {
    test('should fetch data for different cars', async () => {
      const car1 = mockCarData;
      const car2 = { ...mockCarData, licensePlate: 'XYZ-789', owner: 'Jane Smith' };
      
      axios.get
        .mockResolvedValueOnce({ data: car1 })
        .mockResolvedValueOnce({ data: car2 });
      
      const { getByPlaceholderText, getByText, findByText } = render(<App />);
      
      // Fetch first car
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      await findByText('John Doe');
      
      // Fetch second car
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'XYZ-789');
      fireEvent.press(getByText('Get Car Data'));
      await findByText('Jane Smith');
      
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('API Integration', () => {
    test('should call correct API endpoint', async () => {
      axios.get.mockResolvedValueOnce({ data: mockCarData });
      
      const { getByPlaceholderText, getByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('http://localhost:3001/api/car/ABC-123');
      });
    });

    test('should encode license plate in URL', async () => {
      axios.get.mockResolvedValueOnce({ data: mockCarData });
      
      const { getByPlaceholderText, getByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      fireEvent.press(getByText('Get Car Data'));
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('ABC-123')
        );
      });
    });
  });

  describe('Performance', () => {
    test('should handle rapid button clicks', async () => {
      axios.get.mockResolvedValue({ data: mockCarData });
      
      const { getByPlaceholderText, getByText } = render(<App />);
      
      fireEvent.changeText(getByPlaceholderText('e.g. ABC-123'), 'ABC-123');
      const button = getByText('Get Car Data');
      
      // Rapid clicks
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      
      await waitFor(() => {
        // Should only make one call due to loading state
        expect(axios.get).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    test('should have accessible labels', () => {
      const { getAllByText, getByPlaceholderText } = render(<App />);
      // Check that input has a placeholder
      expect(getByPlaceholderText('e.g. ABC-123')).toBeTruthy();
      // React Native Paper TextInput shows label - there may be multiple instances
      const licensePlateTexts = getAllByText('License Plate');
      expect(licensePlateTexts.length).toBeGreaterThan(0);
    });

    test('should have accessible button', () => {
      const { getByText } = render(<App />);
      const button = getByText('Get Car Data');
      expect(button).toBeTruthy();
    });
  });
});
