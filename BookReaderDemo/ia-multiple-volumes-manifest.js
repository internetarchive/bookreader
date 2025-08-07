/* eslint-disable no-useless-escape */
const extraVolOptions = {
  "isBeta": false,
  "el": "#BookReader",
  "enableBookTitleLink": false,
  "bookUrlText": null,
  "startFullscreen": false,
  "onePage": {
    "autofit": "auto"
  },
  "showToolbar": false,
  "autoResize": false,
  "enableFSLogoShortcut": true,
  "enableBookmarks": true,
  "enableMultipleBooks": true,
  "purchase_url": "",
  "multipleBooksList": {
    "by_subprefix": {
      "book1/GPORFP": {
        "url_path": "/details/SubBookTest",
        "file_subprefix": "book1/GPORFP",
        "title": "book1/GPORFP.pdf",
        "file_source": "/book1/GPORFP_jp2.zip",
        "orig_sort": 0
      },
      "subdir/book2/brewster_kahle_internet_archive": {
        "url_path": "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive",
        "file_subprefix": "subdir/book2/brewster_kahle_internet_archive",
        "title": "subdir/book2/brewster_kahle_internet_archive.pdf",
        "file_source": "/subdir/book2/brewster_kahle_internet_archive_jp2.zip",
        "orig_sort": 1
      },
      "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume": {
        "url_path": "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
        "file_subprefix": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
        "title": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume.pdf",
        "file_source": "/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume_jp2.zip",
        "orig_sort": 2
      }
    },
    "main_dir": "/2/items/SubBookTest"
  }
};
const custvolumesManifest = {
  "data": {
    "streamOnly": false,
    "isRestricted": false,
    "id": "SubBookTest",
    "subPrefix": "book1/GPORFP",
    "olHost": "https://openlibrary.org",
    "bookUrl": "/details/SubBookTest",
    "downloadUrls": [
      [
        "PDF",
        "//archive.org/download/SubBookTest/book1/GPORFP.pdf"
      ],
      [
        "ePub",
        "//archive.org/download/SubBookTest/book1/GPORFP.epub"
      ],
      [
        "Plain Text",
        "//archive.org/download/SubBookTest/book1/GPORFP_djvu.txt"
      ],
      [
        "DAISY",
        "//archive.org/download/SubBookTest/book1/GPORFP_daisy.zip"
      ],
      [
        "Kindle",
        "//archive.org/download/SubBookTest/book1/GPORFP.mobi"
      ]
    ]
  },
  "brOptions": {
    "bookId": "SubBookTest",
    "bookPath": "/2/items/SubBookTest/book1/GPORFP",
    "imageFormat": "jp2",
    "server": "ia800304.us.archive.org",
    "subPrefix": "book1/GPORFP",
    "zip": "/2/items/SubBookTest/book1/GPORFP_jp2.zip",
    "bookTitle": "Test with sub-dirs",
    "ppi": "600",
    "defaultStartLeaf": 0,
    "pageProgression": "lr",
    "vars": {
      "bookId": "SubBookTest",
      "bookPath": "/2/items/SubBookTest/book1/GPORFP",
      "server": "ia800304.us.archive.org",
      "subPrefix": "book1/GPORFP"
    },
    "plugins": {
      "textSelection": {
        "enabled": true,
        "singlePageDjvuXmlUrl": "https://{{server}}/BookReader/BookReaderGetTextWrapper.php?path={{bookPath|urlencode}}_djvu.xml&mode=djvu_xml&page={{pageIndex}}"
      }
    },
    "data": [
      [
        {
          "width": 5213,
          "height": 6566,
          "uri": "https://ia800304.us.archive.org/BookReader/BookReaderImages.php?zip=/2/items/SubBookTest/book1/GPORFP_jp2.zip&file=GPORFP_jp2/GPORFP_0000.jp2&id=SubBookTest",
          "leafNum": 0,
          "uri_2": {
            "link": "https://archive.org/download/SubBookTest/book1/GPORFP_jp2.zip/GPORFP_jp2%2FGPORFP_0000.jp2",
            "base_params": "ext=jpg"
          },
          "pageType": "Title",
          "pageSide": "R"
        }
      ]
    ]
  },
  "lendingInfo": {
    "lendingStatus": null,
    "userid": 0,
    "isAdmin": false,
    "isArchiveOrgLending": false,
    "isOpenLibraryLending": false,
    "isLendingRequired": false,
    "isBrowserBorrowable": false,
    "isPrintDisabledOnly": false,
    "isAvailable": false,
    "isAvailableForBrowsing": false,
    "userHasBorrowed": false,
    "userHasBrowsed": false,
    "userOnWaitingList": false,
    "userHoldIsReady": false,
    "userIsPrintDisabled": false,
    "shouldProtectImages": false,
    "daysLeftOnLoan": 0,
    "secondsLeftOnLoan": 0,
    "loansUrl": "",
    "bookUrl": "",
    "loanCount": 0,
    "totalWaitlistCount": 0,
    "userWaitlistPosition": -1,
    "maxLoans": 10,
    "loanRecord": [

    ]
  },
  "metadata": {
    "identifier": "SubBookTest",
    "title": "Test with sub-dirs",
    "mediatype": "texts",
    "collection": [
      "opensource",
      "community"
    ],
    "publicdate": "2009-07-08 23:10:10",
    "addeddate": "2009-07-08 23:09:09",
    "uploader": "mang@archive.org",
    "updatedate": "2009-07-08 23:10:24",
    "updater": "mang@archive",
    "language": "English",
    "identifier-access": "http://www.archive.org/details/SubBookTest",
    "identifier-ark": "ark:/13960/t08w3w21h",
    "ppi": "600",
    "ocr": "ABBYY FineReader 8.0",
    "repub_state": "4",
    "noindex": "true",
    "curation": "[curator]validator@archive.org[/curator][date]20140402011645[/date][comment]checked for malware[/comment]",
    "backup_location": "ia903603_14"
  }
};

export { custvolumesManifest, extraVolOptions };
