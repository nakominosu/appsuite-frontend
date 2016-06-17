/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quat@open-xchange.com>
 */

define('plugins/portal/oxdriveclients/settings/defaults', function () {

    'use strict';

    return {
        linkTo: {
            'Android': 'https://play.google.com/store/apps/details?id=com.openexchange.drive.vanilla',
            'iOS': 'https://itunes.apple.com/us/app/ox-drive/id798570177?l=de&ls=1&mt=8',
            'Mac OS': 'https://itunes.apple.com/us/app/ox-drive/id818195014?l=de&ls=1&mt=12',
            'Windows': '/updater/installer/oxupdater-install.exe'
        },
        appIcon: {
            'Android': 'url(data:image/png;base64,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)',
            'iOS': 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKcAAACnCAMAAABDyLzeAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAwUExUReYAAP///+UAAMwAAMUAANcAAN8AANEAAL0AALUAAPnMzOgdHf7t7etLS/F6evWgoEXRP+EAAAQ/SURBVHja7ZuLdqsgEEUHEtTy/P+/vaCmjxvAAUfUFTZWu9ous3N4JylAp9PpdDqdTqfT6XQ6nU6n0+l0Op1Op3M0PPD65rKOoIy1zkmPc9YouKArB2OlZr/R0hl1LVWurGQxtDPAr2PpNEtyFVOfZcZyNlUXEOVGsi20PTtSDo5hkOdGypVkOLThZ9a5Zmgsv4XmeaKFmmeJclWoydgZbRTfhfZ1Jr4Xx8rxw1Mhuz0Nq8G19ixvnK8m2tbT1WkW1zycUevL4NTS01V7anWwpzLGbyoC1lrGGgVa5vm+qahHwlGeqU0Fa9Dl8Z7GMVrcEZ6K2tL3JCD3BItvlWHbLskrHuWJX2pIq+ZVA6opW2JP9PpS/mx9/dAgKRsowhM9SL72vfy1myccmYBQc5VUSq2qjm5KAjJN+XrhRjPtm+lsulH1hJ62YL72mt/jgg6boK1VnyHzNAXTddDM/eBAT/wqWKuw8XzbreVvQOYpCybBt+YYGmx+4UflWbBs87X81kh8oPlbEHmW7H1iTjH3v/19IPFELj10IHg6/RcXPOfv0rMsgScuTm1UYJ7U/+f7h+mZF6sKO+PUqBc0c89Z232euDiRr8Bk26k02+0UBp4oFjtsosg/a8eHjQL7xk4iTya3uj6knoFiLT1n0Zo8cdVO57mVaDJP19iTyXyeqV/I1p7MDRnRRJ4Dcs6k9GRmSJum8jSs1tNvPCLvumE8tRqK86z25EZq+T76o+rHludpKz3XiedNFOUZAi3Ms9rTxt8iwrX3ZKA+zxg78nQ/y/tyTz0MCZ94vQ8neYYuH/e5Vp5hDL1FnrI0T3OO59zj43nGOclznpNiQJD9/xjq500Kz5hQKs9BnjDOLyNoKs9Ia/BUr+usDp+rgQaeM9XrZK6M4u08d+w7eOW6rspzaLqP2+FpT/E0xZ7IlRixpyr2RPV4as/UginnqU7wdGlPkSyuvWfoRiJ2ZPJEtVCK18E2lyEbeQpEl5eoT3RykNhqT6jAnGrqC3F3aRCeBvmGhBEpFfhuArErqlXJbbBv6aVVwJ+XI3qt/9xP1Scx0iogBrGzidJ9EEMIkRKBvKYQrpmmVhkREDlaimqTE8nX+yxqmzVOkRbJ57lEanUDTbtWXwIQ370qfgSMbKE5rLFEj808F9yJbfOVJ4pDI3VKUHkeaCoN4tHxnt7UHdChpEU9domnEMo40lSlM2I8wFOMo3dd//dtJ+E/55CSpZ7johoQe3ndBXknGAW+LCdK1ntuFxgLRJcTJQL78CDG4kJ4oAsUJPQrVqoDW0Gh3uc/xXwdBOqhYbwH3fNTPR+3KPC4B3CPOB/3ybN7fqjn8w4H+NMdROF5D+D5uEW5T57d84M9p6tfYHqG8rz6BZ7T5K/T1S9rntPVLzDNPK9+WT0vT/ck9/y6wwFfX9MdDriF5uQ9Z6arn1fPy9M9P9PzH5uvGSaTltxBAAAAAElFTkSuQmCC)',
            'Mac OS': 'url(data:image/png;base64,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)',
            'Windows': 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAMAAADQmBKKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAYBQTFRFKWyUtcvXx9fhJ2mQJmaMGGKN2OLnAkp3JmSKNXSaFV2HJGGFLHSdq8TSVYmoR4Sn////h6zBw9Xf/v36KGyTapi09vb04+ruQ3mYA1SD+fj3J2iOMm6R9PX0Km+XdJ206/Dz+vr5KGiPnLnKBVB9f6O3ZJKuNHCVgqa75+3wPHmcdKG6/Pr4C1uK//77LnGZPHOUKGaLe6W9KnCYLnSd9/n6vtDaob3NClWCpMHR8vb5Km6V9/f1ImWOk7bLlLPF+Pv8LG6VDVmGToGf8vT1KW+Xz9zjJmOJJ2aL9PTzKGmQJWWKKGuSIGGJjLDEKWqRJ2eN9vf3N3ie8PLymrfHEVV/IGCGMm2PYY+pPnyhLmySLG+XNnabJGaNIGSMH2eRKW2VVo+wXpGvKmuRJ2WJBleHJWKGK3KbLHOdOHmgOX2j9fb19fX0LGqPb5+7krjNQYClgarCK2uRj6/BLHGaK3CYKm6WJmSJLHGZJWOHLXKbJGKGJWOILXOc9vb1////KmZhwwAAAIB0Uk5T/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wA4BUtnAAAH4UlEQVR42szc+1vayBoH8ICE0WyRVy5CsCqVqKVAgt0aUdEiVA7eeugFK0WNbOWc7Zq6XtsuXeO/fgY9XbmGBELI95den8znmXlnMgOPQ9zWZcnx52nRfvZHz3NmL57+6Viqb5+o+VPC5H6hc9ymREtQYtH+og85W0w0B5ntj/oUu7kJKHH+qI85T9SD/MVHfU3RXwvy2H/vc+zBapC/7x4s8j+A5os3Bkhx/h/Q+Y0hcv4T5LgxSBz3oITdKCB74g60eGOYLFZAiTPjgM4SGGS6MVBMGOQuGyjuW2LphZFAL5YIR9lQcRCrxgKtEqH/GiqnRNFYoCJxdmWo2InPxgLljQb6THz+bqj0BLReybURQOsCGcEhK6n8hhKOrvsFKq+T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)'
        },
        // list all languages for which are localized shop images available. All other will fall back to EN
        // images are located under apps/plugins/portal/oxdriveclients/img
        l10nImages: ['de', 'en', 'es', 'fr', 'it', 'nl'],
        // defaults to OX Drive with our logo
        productName: 'OX Drive',
        // App Icon as 144x144px png in base64 encoding as ready to use CSS url: url(data:image/png;base46data)
        appIconAsBase64: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAMAAADQmBKKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAYBQTFRFKWyUtcvXx9fhJ2mQJmaMGGKN2OLnAkp3JmSKNXSaFV2HJGGFLHSdq8TSVYmoR4Sn////h6zBw9Xf/v36KGyTapi09vb04+ruQ3mYA1SD+fj3J2iOMm6R9PX0Km+XdJ206/Dz+vr5KGiPnLnKBVB9f6O3ZJKuNHCVgqa75+3wPHmcdKG6/Pr4C1uK//77LnGZPHOUKGaLe6W9KnCYLnSd9/n6vtDaob3NClWCpMHR8vb5Km6V9/f1ImWOk7bLlLPF+Pv8LG6VDVmGToGf8vT1KW+Xz9zjJmOJJ2aL9PTzKGmQJWWKKGuSIGGJjLDEKWqRJ2eN9vf3N3ie8PLymrfHEVV/IGCGMm2PYY+pPnyhLmySLG+XNnabJGaNIGSMH2eRKW2VVo+wXpGvKmuRJ2WJBleHJWKGK3KbLHOdOHmgOX2j9fb19fX0LGqPb5+7krjNQYClgarCK2uRj6/BLHGaK3CYKm6WJmSJLHGZJWOHLXKbJGKGJWOILXOc9vb1////KmZhwwAAAIB0Uk5T/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wA4BUtnAAAH4UlEQVR42szc+1vayBoH8ICE0WyRVy5CsCqVqKVAgt0aUdEiVA7eeugFK0WNbOWc7Zq6XtsuXeO/fgY9XbmGBELI95den8znmXlnMgOPQ9zWZcnx52nRfvZHz3NmL57+6Viqb5+o+VPC5H6hc9ymREtQYtH+og85W0w0B5ntj/oUu7kJKHH+qI85T9SD/MVHfU3RXwvy2H/vc+zBapC/7x4s8j+A5os3Bkhx/h/Q+Y0hcv4T5LgxSBz3oITdKCB74g60eGOYLFZAiTPjgM4SGGS6MVBMGOQuGyjuW2LphZFAL5YIR9lQcRCrxgKtEqH/GiqnRNFYoCJxdmWo2InPxgLljQb6THz+bqj0BLReybURQOsCGcEhK6n8hhKOrvsFKq+T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)'
    };

});
