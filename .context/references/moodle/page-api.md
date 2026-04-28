# Moodle Page API Reference

> **Source**: Moodle Documentation (https://docs.moodle.org/dev/Page_API)
> **Purpose**: Reference for integrating with Moodle's Page API when building Moodle-based features for the Diploma Tracking System
> **Note**: The original docs.moodle.org site returns 403 Forbidden. This content is preserved locally from pasted documentation.
> **Alternative**: Moodle Developer Documentation (accessible): https://moodledev.io/docs/5.2/apis (see Page API section)

---

## Overview

The Page API is used to set up the current page, add JavaScript, and configure how things will be displayed to the user.

The Page API is an integral part of any Moodle page. It allows the developer to set things up the way they envisage it. Through the Page API you can set things like the title, initial heading, where the user is for the navigation, and which layout you think the page should use.

---

## A Simple Example

This example covers how to set up a basic page for use within an activity plugin and is undoubtedly the simplest example as much of the work is done behind the scenes for you.

```php
// File: /mod/mymodulename/view.php
require_once('../../config.php');
$cmid = required_param('id', PARAM_INT);
$cm = get_coursemodule_from_id('mymodulename', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);

require_login($course, true, $cm);
$PAGE->set_url('/mod/mymodulename/view.php', array('id' => $cm->id));
$PAGE->set_title('My modules page title');
$PAGE->set_heading('My modules page heading');

// The rest of your code goes below this.
```

If you are not familiar with what the first four lines are doing try going through these docs before proceeding:

- [Context explained](https://docs.moodle.org/en/Context)
- [Course module explained](https://docs.moodle.org/dev/Course_module)

So lets start at `require_login` and assume you already have the course and course module objects ready to use. When you call `require_login` part of the magic it does for you is set up the basic for the current page.

In the case of the example above because `require_login` is given a course and course module it is already setting up much of the page for you. It is giving the course and course module objects to the page, setting the context for the page to the course modules context, and setting the page layout to `incourse` so that you get the standard look of a course module.

The set up that we are having to do is as follows:

1. Set the URL for the page. This MUST be done.
2. Set a title for the page. Most likely will be shown in the `<title>` tag.
3. Set the heading for the page. Most likely used in the pages header.

It's important to mention that this has to be done before output starts. That means you must set up the page before the header is printed and before you instantiate any moodleform instances.

And that is it, if you were to add a bit of simple output there you would get a page that already looks like other module pages you would have seen. Simple as.

---

## $PAGE - The Moodle Page Global

For every page request Moodle sets up a couple of global structures that you will likely need. `$DB` the database object, and `$CFG` which stores configuration are two that you are likely already aware of. `$PAGE` is the focus of this article, it is a `moodle_page` instance that stores all of the information and is used by the output library `$OUTPUT` when displaying the page.

It's important to note the difference between `$PAGE` and `$OUTPUT`:
- `$PAGE` is for setting up the page
- `$OUTPUT` is for displaying the page
- `$PAGE` contains lots of logic and magic
- `$OUTPUT` is purely about display and does little more than produce HTML

---

## Setting Up the Page

When creating a page in Moodle there are a couple of things that you must set, and a couple of things that get set for you in many cases but not all of the time.

### URL (Required)

This is an absolute must, failing to set this will lead Moodle to display an error that it has not been set.

It can be set in the following manner:

```php
$PAGE->set_url(new moodle_url('/path/to/your/file.php', array('key' => 'value', 'id' => 3)));
$PAGE->set_url('/path/to/your/file.php', array('key' => 'value', 'id' => 3)));
$PAGE->set_url('/path/to/your/file.php?key=value&id=3');
```

The above code sets the page URL 3 times, and highlights the 3 different ways you can set the URL. Either of the first two methods are the preferred way as it provides 100% accuracy when processing the URL. Internally `set_url()` converts whatever you give it to a `moodle_url` object.

The URL that you give to the page is going to be used by many Moodle core API's. Most importantly it is going to be used to create the navigation for your page so it's very important you set it accurately.

### Context (Required)

This is an absolute must as well, however in many cases it will be set for you magically by Moodle.

In order to set the context for the page you must provide a context object. In Moodle 2.2 and greater this will look as follows:

```php
// Moodle 2.2 and greater
$PAGE->set_context(context_system::instance());
$PAGE->set_context(context_coursecat::instance($categoryid));
$PAGE->set_context(context_course::instance($courseid));
$PAGE->set_context(context_module::instance($moduleid));
```

In Moodle 2.0+, and Moodle 2.1+ the following is the equivalent code:

```php
// Moodle 2.0 and 2.1
$PAGE->set_context(get_system_context());
$PAGE->set_context(get_context_instance(CONTEXT_COURSECAT, $categoryid));
$PAGE->set_context(get_context_instance(CONTEXT_COURSE, $courseid));
$PAGE->set_context(get_context_instance(CONTEXT_MODULE, $moduleid));
```

In both examples above setting different types of contexts has been illustrated however you should only ever call `set_context()` once with the context that is most appropriate to the page you are creating.

If it is a plugin then the context to use would be the context you are using for your capability checks.

As mentioned above the other thing to be aware of is that in some circumstances this gets automatically set for you.

If your script calls `require_login` (and most scripts have to) and you are providing a course, or a module to your require login call then you will not need to call `set_context()`.

This is because `require_login` handles it for you.

If your script doesn't call `require_login`, or you don't call it with a course and/or module then you will need to manually set the context as shown.

### Optional Setup

The following are optional extras you can set up against the PAGE object that you are likely to encounter throughout Moodle core, and are likely to want to use yourself.

#### Page Layout

The following code sets the pages layout to the standard layout, the most generic layout in the arsenal.

```php
$PAGE->set_pagelayout('standard');
```

When setting the page layout you should use the layout that is the closest match to the page you are creating. Layouts are used by themes to determine what is shown on the page. The most prominent difference between layouts is the block regions they support. The default layout `base` for example doesn't normally have any block regions at all, where as normally `standard` has the most generic layout and several block regions.

There are dozens of different layouts that can be, and are used throughout Moodle core that you can use within your code. For a full list of common layouts you are best to look at `theme/base/config.php` or refer to the list below.

**Note**: It's important to know that the theme determines what layouts are available and how each looks. If you select a layout that the theme doesn't support then it will revert to the default layout while using that theme.

Themes are also able to specify additional layouts, however its important to spot them and know that while they may work with one theme they are unlikely to work as you expect with other themes.

#### Base Theme Page Layouts

| Layout | Description |
|--------|-------------|
| `base` | Most backwards compatible layout without the blocks. This is the layout used by default. |
| `standard` | Standard layout with blocks, this is recommended for most pages with general information |
| `course` | The course main page uses this layout. |
| `coursecategory` | Category course listings. |
| `incourse` | Used for areas within a course, typical for modules. Default page layout if $cm specified in require_login(). |
| `frontpage` | The site home page uses this. |
| `admin` | Admin and settings pages as well as server administration scripts. |
| `mydashboard` | The users dashboard. |
| `mypublic` | A users public profile uses this layout. |
| `login` | The login screen. |
| `popup` | Pages that appear in popup windows, usually no navigation, blocks, or header. |
| `frametop` | Used for the outermost content of a page constructed with frames. Usually no blocks and minimal footer. |
| `embedded` | Embedded pages such as content for iframes/objects. Needs as much space as possible usually no blocks, header, or footer. |
| `maintenance` | Used during upgrade, installation, and when maintenance mode is enabled. |
| `print` | Gets used when printing a page. Normally just a simple header and no blocks. |
| `redirect` | A special layout used during a redirect. Normally with content only. |
| `report` | Used for reports within Moodle. Special layout designed to handle horizontal scrolling in a nice way. |

#### Title

Setting an appropriate title is certainly a must for any properly designed page. While it is optional it is highly recommended that you set the title.

```php
$PAGE->set_title('This is my title');
```

When setting the title for the page you need to provide just the string you want to use for the title. It should be a basic string and contain no HTML. Any HTML will be stripped out as the title is used within the `<title>` tag in the HTML head.

#### Heading

Like title it is highly recommended that you set a meaningful heading for the page, although it is optional.

The heading is normally displayed at the top of the page before the rest of the content starts. However it is up to the layout defined by the theme as to where it is displayed. Not all layouts will display a heading but I encourage you to always set one even if you are using a layout that doesn't support headings. This way if you are using a theme that uses a heading on every page regardless of layout things still look consistent.

```php
$PAGE->set_heading(get_string('pluginname', 'local_myplugin'));
```

When setting a heading there is just one argument, the string to use for the heading. It should be a basic string and contain no HTML.

### Advanced Setup

The following are advanced optional methods you can call to further set up your page. In most cases you will never need to use these.

| Method | Description |
|--------|-------------|
| `set_activity_record` | If you have called `require_login` with a course module, or you have manually set a course module on `$PAGE` then one other thing you may want to do is set the activity module record on `$PAGE` as well. This is best done when you have already fetched the activity record yourself in which case manually setting the activity record may reduce the number of queries for the page by 1. |
| `set_blocks_editing_capability` | Using this method you can set an additional capability that users must posses before being able to edit blocks on this page. By default `'moodle/site:manageblocks'` is used however there are sometimes reasons to use a different capability. |
| `set_button` | This allows you to set some HTML that will be shown in the navigation bar where the `Turn on editing` button normally lives. |
| `set_cacheable` | By setting this to false the page will be sent with headers to prevent the client from caching the page. Defaults to true. |
| `set_category_by_id` | Allows you to set a category that this page is displaying. Calling this will force the `$PAGE->course` to be set to the front page course. |
| `set_cm` | Like set page above, sometimes you need to manually set the course module for `$PAGE`. Again you must set the context to the context of the course module if you call this. |
| `set_course` | This allows you to set the course the page belongs to. Normally when you call `require_login` the course you give it automatically gets sent to `$PAGE` for you. However if you don't want to require login for the course, but you need it in `$PAGE` then you can call `set_course` and provide it. Note that if you do this then you MUST use the context of the course when calling `set_context()`. |
| `set_docs_path` | Normally this gets automatically constructed for you, however in some circumstances you may want to manually set it. This allows you to have several pages that all point to the same docs page rather than requiring a docs page for each. The docs page link is normally shown by a theme in the footer. |
| `set_focuscontrol` | If you pass this method an element id when the page loads on the client focus will be shifted to the element with the corresponding id. Using this function is a REALLY bad idea in most situations because changing focus automatically in a browser is a nightmare for the vision impaired and those using screen readers. |
| `set_headingmenu` | This allows you to set some HTML that will be shown next to the pages main heading where the language select box normally lives. |
| `set_other_editing_capability` | Can be used to set an additional capability that the user must posses before they can turn editing on for this page. This is useful if you can an editing more for your page that is more than just editing blocks. |
| `set_pagetype` | This gets automatically set up for by default to the path of your file e.g. `mod/mymod/index.php` will set up as `mod-mymod-index`. This is absolutely fine in 99% of cases however every now and again there is a reason to override it. |
| `set_periodic_refresh_delay` | If set a meta tag gets added to the page header causing it to refresh intermittently. This is rarely needed but can be useful if you need to automatically refresh the likes of a chat page, or news feed. Today it is not recommended to use this, but instead to create a means of getting additional content via AJAX. |
| `set_popup_notification_allowed` | Allow or disallow popup notifications on this page. Things like messaging can cause messages to popup at the bottom of the screen sometimes. On some pages this functionality is not desired and can be stopped by calling this method and using false as the first argument. Popups are allowed by default. |
| `set_subpage` | If `context->id` and `pagetype` are not enough to uniquely identify this page and you need to include another string to make it more unique you can do it by calling this method setting a custom sub page type. |
| `add_body_class` | Adds a CSS class to the body tag that will be printed by the Output API as part of the header. This is useful for adding classes to the body tag that describe the content of the page and may be required for styling the whole page, or for including indicator classes that may be useful to look for in JavaScript. |
| `add_body_classes` | Adds an array of CSS classes to the body tag. Have a look at the above comment for `add_body_class` for more details. |
| `force_settings_menu` | Theme boost does it's best to find a place to put a settings cog for your activity / resource, but if for some reason it isn't displayed, you can manually set the settings cog to be displayed on the page. This should be called before main content is displayed. This setting only currently shows the setting cog on theme_boost. |

---

## Getting Information About the Page

As well of setting up the page you can of course get information back from it about the page it has been set up to display.

Anything you set against the page can be retrieved as can any information that was set magically for you by other methods.

The following are the most interesting and likely useful things you can get back from the page.

| Property | Description |
|----------|-------------|
| `activityrecord` | The activityrecord will be the record from the database that relates to the cm that was set by `require_login`, or manually by your code. For example if you provided a `$cm` instance that related to a forum this will be a row from the forum table. |
| `blockmanager` | This is the block manager responsible for loading the all of the blocks that will be shown on the page. For more information see the Blocks API. |
| `bodyid` | The id that will be given to the body tag when the page is displayed. |
| `categories` | An array of all the categories the page course belongs to, starting with the immediately containing category. |
| `category` | The category that the page course belongs to. |
| `cm` | The course module that has been set for the page. |
| `course` | The course that has been set for the page. |
| `devicetypeinuse` | The device the user is using browse the page. |
| `headerprinted` | Is true if the page header has already been printed. |
| `heading` | The page heading. |
| `navbar` | Gets a reference to the pages navigation bar so that you can interact with that. See the Navigation API for more information. |
| `navigation` | Gets a reference to the navigation for the page. See the Navigation API for more information. |
| `requires` | Gets the page requirements manager that handles any JavaScript and special CSS requirements for the page. |
| `settingsnav` | Gets the settings navigation for the page. See the Navigation API for more information. |
| `theme` | Gets the theme that is being used for the page. Is a `theme_config` object. |
| `title` | Gets the title for the page. |
| `url` | Gets the URL that was set for the page. Is a `moodle_url` object. |

---

## FAQs

### I don't have any blocks on my page?

This has happened because you have not set a page layout that uses blocks OR you have set it after output has started. Once output has started you cannot change integral aspects of that page that are used for the initial output. Included is the page title, heading, url and layout.

### I am getting a notice about not having set the page URL but I have set it?

As above you must set up the page before output starts, trying to do so will lead to notices and developer warnings about having things in the wrong order.

### What starts output?

Output starts when either the script calls `echo $OUTPUT->header` OR a moodleform is instantiated.

---

## Related APIs

There are a couple of APIs that are closely related to the Page API that you should be aware of as well.

### Output API

The output API is an immediate relation of the page API. The page API is about setting things up, whereas the output API is all about displaying things.

It's through the output API that content is actually produced, and much of the information you set up through the page is used to customise what is produced, and fill in the general blanks of any page (such as title and heading).

See the [Output API](https://docs.moodle.org/dev/Output_API) documentation for more information.

### Page Requirements API

The page requirements API allows you the developer to include additional CSS, and JavaScript resources that should be included with the page, and to include JavaScript calls within the page through a variety of means.

Technically this API is part of the Output API mentioned above, however it deserves special mention. If you are going to be using any JavaScript or CSS within your page you will need to know about this.

See the [Output API](https://docs.moodle.org/dev/Output_API) documentation for more information on the page requirements API.

### Navigation API

The final API to mention is the navigation API. This again is integral to both the page and output API and is used to recognise the context of the content being displayed and ensure that the correct blocks and navigation structure are loaded for the context.

There is a good chance that you will encounter a need to customise the navigation early on in plugin page development and it's important to be aware of this important API.

See the [Navigation API](https://docs.moodle.org/dev/Navigation_API) documentation for more information on the page requirements API.

---

## See Also

- [Core APIs](https://docs.moodle.org/dev/Core_APIs) - A list of all the core API's in Moodle.
- [Output API](https://docs.moodle.org/dev/Output_API) - The Output API.
- [Navigation API](https://docs.moodle.org/dev/Navigation_API) - The Navigation API.
- [General developer forum](http://moodle.org/mod/forum/view.php?id=55) - The place to ask question you may have about the Page API.
- MDL-30977 - The issue to see the Page API properly documented.

---

**Category**: API
