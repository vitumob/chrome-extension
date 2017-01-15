import config from './helpers/config';
import headerbar from './includes/headerbar';
import modal from './includes/modal';
import main from './main';
// import axois from 'axois';

$(document).ready(() => {
  // Check if the site loaded is one of the merchants we support
  // and is not AWS's console/console
  const hostname = location.hostname.split('.').splice(-2).join('.');
  const isNotAWSConsole = 'aws' in location.hostname.split('.') || 'console' in location.hostname.split('.');
  const isMerchant = $.inArray(hostname, config.merchants);
  if (isMerchant > -1 && !isNotAWSConsole) {
    // Add logic once headerbar & modal box have been injected and compiled
    Promise.all([headerbar(), modal()]).then((promised) => {
      // VM headerbar and modal injected into the merchant's page
      const { headerBar, stickyHeaderBar } = promised[0];
      const modalbox = promised[1];
      const merchantScraper = main[hostname.replace(/\.co(m|\.uk)/gi, '')].default;

      // check for the VM hashtag in the page
      if (location.href.indexOf('vm-autocheckout') > -1) {
        // tell the user VM has began extracting the items in the page
        modalbox.find('.modal-action-merchant').text(location.hostname);
        modalbox.find('.modal-action-message').text('Please give us a few seconds...');
        modalbox.show();
        // wait for the page to complete loading then start the extraction
        window.onload = () => {
          try {
            const cartItems = merchantScraper.scraper();
            if (!cartItems.length) {
              chrome.runtime.sendMessage({
                type: 'SHOPPING_CART_IS_EMPTY',
                hostname: location.hostname,
              });
              return;
            }

            const dataToSubmit = Object.assign({ cartItems }, merchantScraper);
            console.log(dataToSubmit);
          } catch (err) {
            // On error, GRAB MERCHANT CART HTML, stringify it and send it to VM admin as email
            console.error(err);
          }
        };
      }

      // TO DO: Trottle/Debounce the header clicking to be clicked once every 3 seconds
      const headerBarOnClick = () => {
        if (location.href.indexOf(merchantScraper.cartPath) === -1) {
          window.location = encodeURI(merchantScraper.cartPath + '?#vm-autocheckout');
        }
        // user happens to be in the cart page
        // just load up the scrapper
      };

      headerBar.click(headerBarOnClick);
      stickyHeaderBar.click(headerBarOnClick);
    });
  }
});
