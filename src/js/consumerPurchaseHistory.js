const App = {
    web3Provider: null,
    contracts: {},

    init: async function() {
        return await App.initWeb3();
    },

    initWeb3: async function() {


        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            await window.ethereum.request({ method: 'eth_requestAccounts' });// Request account access
        } else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        web3 = new Web3(App.web3Provider);
        return App.initContract();
    },

    initContract: function() {
        $.getJSON('product.json', function(data) {
            const productArtifact = data;
            App.contracts.product = TruffleContract(productArtifact);
            App.contracts.product.setProvider(App.web3Provider);
        });

        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', '.btn-register', App.getData);
    },

    getData: function(event) {
        event.preventDefault();
        const consumerCode = document.getElementById('consumerCode').value;

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.error(error);
                return;
            }

            const account = accounts[0];

            App.contracts.product.deployed().then(function(instance) {
                return instance.getPurchaseHistory(web3.utils.asciiToHex(consumerCode), { from: account });
            }).then(function(result) {
                const productSNs = result[0].map(sn => web3.utils.hexToAscii(sn));
                const sellerCodes = result[1].map(code => web3.utils.hexToAscii(code));
                const manufacturerCodes = result[2].map(code => web3.utils.hexToAscii(code));

                let tableContent = "";
                document.getElementById('logdata').innerHTML = ""; // Clear previous data

                for (let i = 0; i < productSNs.length; i++) {
                    if (sellerCodes[i] === "0") {
                        break; // Stop if seller code is 0
                    }
                    tableContent += `<tr>
                        <td>${productSNs[i]}</td>
                        <td>${sellerCodes[i]}</td>
                        <td>${manufacturerCodes[i]}</td>
                    </tr>`;
                }

                document.getElementById('logdata').innerHTML += tableContent;
                document.getElementById('add').innerHTML = account;
            }).catch(function(err) {
                console.error(err.message);
            });
        });
    }
};

$(function() {
    $(window).load(function() {
        App.init();
    });
});
