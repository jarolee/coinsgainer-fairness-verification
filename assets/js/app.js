const CG_GAMES_SALT = '00000000000000000008f125261151e5a1812f3f34cf80f375943c687a9ba6b7'; // bitcoin block #572,752 hash
const CG_MSB_NUMBER = 52; // MSB number (https://en.wikipedia.org/wiki/Bit_numbering#Most_significant_bit)
const HEX_ENCODING = CryptoJS.enc.Hex;

// computation logic
const CG_GAME_RESULT = (gameHash) => {
    gameHash = CryptoJS.HmacSHA256(HEX_ENCODING.parse(gameHash), CG_GAMES_SALT)
        .toString(HEX_ENCODING)
        .slice(0, CG_MSB_NUMBER / 4);
    const hashResult = Math.floor(99 / (1 - parseInt(gameHash, 16) / Math.pow(2, CG_MSB_NUMBER)));
    return Math.max(hashResult / 100, 1);
};

// UI application
const fairnessApp = () => {
    const submitButton = $('#verify-button');
    const gameHashInitial = $('#hash-initial');
    const gamesNumber = $('#games-number');
    const results = $('#results');
    const notice = $('#notice');
    const formGroupSelector = '.form-group';
    const dataRowTemplate = results.find('.data').clone();

    const app = {
        init: () => {
            app.parseUri();
            app.bindSubmit();
        },
        dataInsert: (gHash, gNumber) => {
            let counter = 1;
            while (gNumber > 0) {
                let gameResult = CG_GAME_RESULT(gHash);
                let dataRow = dataRowTemplate.clone();
                dataRow.find('.counter').text(counter + '.');
                dataRow.find('.hash').text(gHash);
                dataRow.find('.result').text(gameResult.toFixed(2));
                if (gameResult < 2) dataRow.addClass('negative');
                gHash = CryptoJS.SHA256(gHash).toString(HEX_ENCODING);
                results.append(dataRow);
                gNumber--;
                counter++;
            }
        },
        parseUri: () => {
            let gameHash = /[?|&]hash=([a-f0-9]{64})/.exec(location.href);
            if (gameHash) {
                gameHashInitial.val(gameHash[1].toLowerCase());
                gamesNumber.val($.isNumeric(location.hash.substr(1)) && parseInt(location.hash.substr(1)) > 0 ? parseInt(location.hash.substr(1)) : 1);
            }
        },
        bindSubmit: () => {
            // bind enter key
            $(document).keypress(function (e) {
                if(e.which === 13) submitButton.click();
            });

            // bind form submit
            submitButton.click((e) => {
                e.preventDefault();
                app.clearFormErrors();
                const gameHashInitialValue = $.trim(gameHashInitial.val());
                const gamesNumberValue = $.trim(gamesNumber.val());

                // validate fields
                if ('' === gameHashInitialValue) {
                    app.triggerFormError(gameHashInitial, 0);
                    return false;
                } else if (!gameHashInitialValue.match(/^[a-f0-9]{64}$/gi)) {
                    app.triggerFormError(gameHashInitial, 1);
                    return false;
                } else if ('' === gamesNumberValue) {
                    app.triggerFormError(gamesNumber, 0);
                    return false;
                } else if (!gamesNumberValue.match(/^[0-9]+$/g) || parseInt(gamesNumberValue) <= 0) {
                    app.triggerFormError(gamesNumber, 1);
                    return false;
                }
                results.find('.data').remove();
                app.showStatus('progress');
                results.addClass('hidden');
                $('body').removeClass('no-flex');

                // process data
                setTimeout(() => {
                    results.removeClass('hidden');
                    $('body').addClass('no-flex');
                    app.dataInsert(gameHashInitialValue, parseInt(gamesNumberValue));
                    app.showStatus('done');
                }, parseInt(gamesNumberValue) >= 1000 ? 100 : 0);
            });
        },
        showStatus: (statusName) => {
            notice.children().addClass('hidden').filter('.notice-' + statusName).removeClass('hidden');
        },
        triggerFormError: (obj, errorCode) => {
            obj.closest(formGroupSelector).addClass('error')
                .find('.errors .item[data-id="' + errorCode + '"]').removeClass('hidden');
        },
        clearFormErrors: () => {
            $(formGroupSelector).removeClass('error')
                .find('.errors .item').addClass('hidden');
        }
    };
    app.init();
};

// init app
$(() => {
    fairnessApp();
});

