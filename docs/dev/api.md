---
layout: default
title: API
permalink: /dev/api
parent: Hacking
nav_order: 8
---


1. TOC
{:toc}

## Authenticate

POST
{: .label .label-orange}


**`/oauth/login`**

> warning "Deprecation warning"
> Note that this end-point will be deprecated on v2.0


**Params**

| username | `string` |  |
| password | `string` |  |
| client_id | `string` | Has to be `"self"` |
| grant_type | `string` | Has to be `"password"` |


**Curl example**

```bash
$ curl 'https://demo.gancio.org/oauth/login' -X POST \
  --data-raw 'username=admin@gancio.org&password=password&grant_type=password&client_id=self'

{"access_token":"627kpqk1u6gxviusgnpieofi659l1hu5","refresh_token":"8sys2uro6eb1kly6wb1f4fcpvbb6oakh","username":"admin@gancio.org","token_type":"Bearer"}%  
```

You can use that token in the `Authorization` header:

```bash
$ curl 'https://demo.gancio.org/api/user' -H 'Authorization: Bearer 627kpqk1u6gxviusgnpieofi659l1hu5' 

{"is_admin":true,"is_editor":false,"id":1,"settings":[],"email":"admin@gancio.org","description":null,"recover_code":"452d666fef915516053037c9c0b91151","role":"admin","is_active":true,"to_notify":true,"createdAt":"2021-07-01T22:22:52.346Z","updatedAt":"2025-05-20T14:49:25.401Z"}
```

**Python example**

- [rss2gancio](https://git.lattuga.net/avana/rss2gancio/src/branch/main/estrai.py#L100)
- [EventHub adapter](https://codeberg.org/EventHub/adapter/src/branch/main/jobs/outbound/gancio/gancio.py#L60)


---

## Get events

GET
{: .label .label-green}

**`/api/events`**

> info "info"
> If showing a particular collection in home, the events returned will be those part of said collection.

**Params**

| start | `integer` | start timestamp (default: now) |
| end | `integer` | end timestamp (optional) |
| tags | `array` | List of tags |
| places | `array` | List of places |
| max | `integer` | Max events |
| show_recurrent | `boolean` | Show also recurrent events (default: as choosen in admin settings) |


***Example***  
[https://demo.gancio.org/api/events](https://demo.gancio.org/api/events)  
[usage example](https://framagit.org/les/gancio/-/blob/master/webcomponents/src/GancioEvents.svelte#L18-42)

---

## Add a new event

POST
{: .label .label-orange}

**`/api/event`**

> info "info"
> `Content-Type` has to be `multipart/form-data` to support image upload


**Params**

| title | `string` | event's title |
| description | `string` | event's description (html accepted and sanitized) |
| place_name | `string` | the name of the place |
| place_address | `string` | the address of the place |
| place_latitude | `float` | the latitude of the place |
| place_longitude | `float` | the longitude of the place |
| online_locations | `array` | List of online locations |
| start_datetime | `integer` | start timestamp |
| multidate | `integer` | is a multidate event? |
| tags | `array` | List of tags |
| recurrent | `object` | Recurrent event details |
| recurrent.frequency | `string` | could be `1w` or `2w` |
| recurrent.days | `array` | array of days |
| image | `image` | Image |
| image_url | `string` | URL of an image |


---


## Update an event

PUT
{: .label .label-red}

**`/api/event`**

> info "info"
> `Content-Type` has to be `multipart/form-data` to support image upload

> info "info"
> Events could be modified by admins or by the event's owner

**Params**

| id | `number` | event's id |
| [title] | `string` | event's title |
| [description] | `string` | event's description (html accepted and sanitized) |
| [place_name] | `string` | the name of the place |
| [place_address] | `string` | the address of the place |
| [place_latitude] | `float` | the latitude of the place |
| [place_longitude] | `float` | the longitude of the place |
| [online_locations] | `array` | List of online locations |
| [start_datetime] | `integer` | start timestamp |
| [multidate] | `integer` | is a multidate event? |
| [tags] | `array` | List of tags |
| [recurrent] | `object` | Recurrent event details |
| [recurrent.frequency] | `string` | could be `1w` or `2w` |
| [recurrent.days] | `array` | array of days |
| [image] | `image` | Image |
| [image_url] | `string` | URL of an image |

---

## Get current authenticated user

GET
{: .label .label-green}

**`/api/user`**



**Response**
```json
  {
    "description" : null,
    "recover_code" : "",
    "id" : 1,
    "createdAt" : "2020-01-29T18:10:16.630Z",
    "updatedAt" : "2020-01-30T22:42:14.789Z",
    "is_active" : true,
    "settings" : "{}",
    "email" : "eventi@cisti.org",
    "is_admin" : true
  }
  ```
---

