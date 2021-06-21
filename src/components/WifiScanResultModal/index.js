/* eslint-disable-rule prefer-destructuring */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CButton,
  CModal,
  CModalHeader,
  CModalBody,
  CModalTitle,
  CModalFooter,
} from '@coreui/react';
import PropTypes from 'prop-types';
import { prettyDate } from 'utils/helper';
import WifiChannelTable from './containers/WifiChannelTable';
import styles from './index.module.scss';

const WifiScanResultModal = ({ show, toggle, scanResults, date }) => {
  const { t } = useTranslation();

  const parseThroughList = (scanList) => {
    const dbmNumber = 4294967295;
    const listOfChannels = [];

    scanList.forEach((scan) => {
      if (!listOfChannels.includes(scan.channel)) {
        listOfChannels.push(scan.channel);
      }
    });

    const finalList = [];
    listOfChannels.forEach((channelNumber) => {
      const channel = {
        channel: channelNumber,
        devices: [],
      };

      scanList.forEach((device) => {
        if (device.channel === channelNumber) {
          const deviceToAdd = {};
          deviceToAdd.SSID = device.ssid ?? 'N/A';
          deviceToAdd.Signal = (dbmNumber - device.signal) * -1;
          channel.devices.push(deviceToAdd);
        }
      });

      finalList.push(channel);
    });
    return finalList;
  };
  return (
    <CModal size="lg" show={show} onClose={toggle}>
      <CModalHeader closeButton>
        <CModalTitle className={styles.modalTitle}>
          {date !== '' ? prettyDate(date) : ''} {t('scan.results')}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {scanResults === null ? null : (
          <WifiChannelTable channels={parseThroughList(scanResults)} />
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={toggle}>
          {t('common.close')}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

WifiScanResultModal.propTypes = {
  show: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  scanResults: PropTypes.instanceOf(Array),
  date: PropTypes.string.isRequired,
};

WifiScanResultModal.defaultProps = {
  scanResults: [],
};

export default WifiScanResultModal;