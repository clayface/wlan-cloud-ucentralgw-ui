import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
} from '@coreui/react';
import { cilOptions } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import eventBus from 'utils/eventBus';
import StatisticsChartList from './StatisticsChartList';
import LatestStatisticsModal from './LatestStatisticsModal';
import styles from './index.module.scss';

const DeviceStatisticsCard = () => {
  const { t } = useTranslation();
  const [showLatestModal, setShowLatestModal] = useState(false);

  const toggleLatestModal = () => {
    setShowLatestModal(!showLatestModal);
  };

  const refresh = () => {
    eventBus.dispatch('refreshInterfaceStatistics', { message: 'Refresh interface statistics' });
  };

  return (
    <div>
      <CCard>
        <CCardHeader>
          <CRow>
            <CCol>
              <div className={['text-value-lg', styles.cardTitle].join(' ')}>
                {t('statistics.title')}
              </div>
            </CCol>
            <CCol className={styles.cardOptions}>
              <CDropdown className="m-1 btn-group">
                <CDropdownToggle>
                  <CIcon name="cil-options" content={cilOptions} size="lg" color="primary" />
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem onClick={refresh}>{t('common.refresh')}</CDropdownItem>
                  <CDropdownItem onClick={toggleLatestModal}>
                    {t('statistics.show_latest')}
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CCol>
          </CRow>
        </CCardHeader>
        <CCardBody className={styles.statsBody}>
          <StatisticsChartList />
        </CCardBody>
      </CCard>
      <LatestStatisticsModal show={showLatestModal} toggle={toggleLatestModal} />
    </div>
  );
};

export default DeviceStatisticsCard;
